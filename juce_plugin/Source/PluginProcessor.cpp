#include "PluginProcessor.h"
#include "PluginEditor.h"

// =============================================================================
// UploadThread
// =============================================================================

UploadThread::UploadThread(juce::AudioBuffer<float> buffer,
                           double                  sampleRate,
                           juce::String            serverUrl,
                           DoneCallback            onDone)
    : juce::Thread("VocalMidi_Upload"),
      buffer_    (std::move(buffer)),
      sampleRate_(sampleRate),
      serverUrl_ (std::move(serverUrl)),
      onDone_    (std::move(onDone))
{}

// ---------------------------------------------------------------------------
// run() — called on the upload thread
// ---------------------------------------------------------------------------
void UploadThread::run()
{
    Result result;

    // 1. Encode the recorded buffer as a 16-bit stereo WAV in memory
    const juce::MemoryBlock wavData = encodeToWav();
    if (wavData.isEmpty())
    {
        result.message = "WAV encoding failed.";
        juce::MessageManager::callAsync([cb = onDone_, r = result]{ cb(r); });
        return;
    }

    // 2. Base64-encode the WAV bytes
    const juce::String base64Audio = toBase64(wavData);

    // 3. Build JSON payload
    //    Base64 alphabet is [A-Za-z0-9+/=] — no JSON escaping needed.
    const juce::String jsonBody =
        "{\"audio\":\"" + base64Audio + "\","
        "\"filename\":\"recording.wav\","
        "\"skip_demucs\":false}";

    // 4. HTTP POST
    if (threadShouldExit()) return;

    juce::URL url(serverUrl_);
    juce::WebInputStream stream(url, /*isPost=*/true);
    stream.withExtraHeaders("Content-Type: application/json\r\n");
    stream.setRequestBody(jsonBody);

    if (!stream.connect(nullptr))
    {
        result.message = "Could not connect to server: " + serverUrl_;
        juce::MessageManager::callAsync([cb = onDone_, r = result]{ cb(r); });
        return;
    }

    const int statusCode = stream.getStatusCode();
    if (statusCode != 200)
    {
        const juce::String body = stream.readEntireStreamAsString();
        result.message = "Server error " + juce::String(statusCode) + ": " + body;
        juce::MessageManager::callAsync([cb = onDone_, r = result]{ cb(r); });
        return;
    }

    // 5. Read MIDI bytes from response
    juce::MemoryBlock midiBytes;
    stream.readIntoMemoryBlock(midiBytes);

    if (midiBytes.getSize() < 4)
    {
        result.message = "Server returned empty or truncated MIDI.";
        juce::MessageManager::callAsync([cb = onDone_, r = result]{ cb(r); });
        return;
    }

    // 6. Validate MIDI magic bytes ("MThd")
    const uint8_t* raw = static_cast<const uint8_t*>(midiBytes.getData());
    if (!(raw[0] == 0x4D && raw[1] == 0x54 && raw[2] == 0x68 && raw[3] == 0x64))
    {
        result.message = "Response does not look like a MIDI file (bad header).";
        juce::MessageManager::callAsync([cb = onDone_, r = result]{ cb(r); });
        return;
    }

    // 7. Save to ~/Documents/VocalMidiExtractor/
    const juce::File outputDir =
        juce::File::getSpecialLocation(juce::File::userDocumentsDirectory)
            .getChildFile("VocalMidiExtractor");
    outputDir.createDirectory();

    const juce::String timestamp =
        juce::Time::getCurrentTime().formatted("%Y%m%d_%H%M%S");
    const juce::File   midiFile = outputDir.getChildFile("vocal_" + timestamp + ".mid");

    if (!midiFile.replaceWithData(midiBytes.getData(), midiBytes.getSize()))
    {
        result.message = "Could not write MIDI file to: " + midiFile.getFullPathName();
        juce::MessageManager::callAsync([cb = onDone_, r = result]{ cb(r); });
        return;
    }

    result.success  = true;
    result.message  = "Saved: " + midiFile.getFullPathName();
    result.midiFile = midiFile;
    juce::MessageManager::callAsync([cb = onDone_, r = result]{ cb(r); });
}

// ---------------------------------------------------------------------------
// encodeToWav
// ---------------------------------------------------------------------------
juce::MemoryBlock UploadThread::encodeToWav() const
{
    juce::WavAudioFormat wavFormat;
    juce::MemoryOutputStream wavStream;

    // Write at 16-bit, using all available channels (max 2 for WAV interop)
    const int numChannels = juce::jmin(buffer_.getNumChannels(), 2);

    std::unique_ptr<juce::AudioFormatWriter> writer(
        wavFormat.createWriterFor(
            &wavStream,
            sampleRate_,
            static_cast<unsigned int>(numChannels),
            /*bitsPerSample=*/16,
            /*metadataValues=*/{},
            /*qualityOptionIndex=*/0));

    if (writer == nullptr)
        return {};

    writer->writeFromAudioSampleBuffer(buffer_, 0, buffer_.getNumSamples());
    writer.reset();  // flush + close before we read wavStream

    return wavStream.getMemoryBlock();
}

// ---------------------------------------------------------------------------
// toBase64
// ---------------------------------------------------------------------------
juce::String UploadThread::toBase64(const juce::MemoryBlock& data)
{
    juce::MemoryOutputStream base64Stream;
    juce::Base64::convertToBase64(base64Stream, data.getData(), data.getSize());
    return base64Stream.toString();
}

// =============================================================================
// VocalMidiProcessor
// =============================================================================

VocalMidiProcessor::VocalMidiProcessor()
    : AudioProcessor(BusesProperties()
          .withInput ("Input",  juce::AudioChannelSet::stereo(), true)
          .withOutput("Output", juce::AudioChannelSet::stereo(), true))
{}

VocalMidiProcessor::~VocalMidiProcessor()
{
    if (uploadThread_ && uploadThread_->isThreadRunning())
        uploadThread_->stopThread(3000);
}

// ---------------------------------------------------------------------------
// prepareToPlay
// ---------------------------------------------------------------------------
void VocalMidiProcessor::prepareToPlay(double sampleRate, int /*samplesPerBlock*/)
{
    currentSampleRate_ = sampleRate;
    totalSamplesToRecord = static_cast<int>(sampleRate * kRecordDuration);

    // Pre-allocate the full 10-second buffer now so the audio thread never
    // allocates during processBlock.
    const int numChannels = getTotalNumInputChannels();
    recordingBuffer_.setSize(numChannels, totalSamplesToRecord, /*keepExisting=*/false,
                             /*clearExtraSpace=*/true, /*avoidReallocating=*/false);
}

// ---------------------------------------------------------------------------
// processBlock — audio thread, NO allocations, NO I/O
// ---------------------------------------------------------------------------
void VocalMidiProcessor::processBlock(juce::AudioBuffer<float>& buffer,
                                      juce::MidiBuffer& /*midi*/)
{
    juce::ScopedNoDenormals noDenormals;

    if (!isRecording.load(std::memory_order_acquire))
        return;

    const int incoming       = buffer.getNumSamples();
    const int alreadyWritten = recordedSamples.load(std::memory_order_relaxed);
    const int remaining      = totalSamplesToRecord - alreadyWritten;

    if (remaining <= 0)
        return;

    const int toCopy = juce::jmin(incoming, remaining);

    for (int ch = 0; ch < juce::jmin(buffer.getNumChannels(),
                                     recordingBuffer_.getNumChannels()); ++ch)
    {
        recordingBuffer_.copyFrom(ch, alreadyWritten, buffer, ch, 0, toCopy);
    }

    const int newTotal = alreadyWritten + toCopy;
    recordedSamples.store(newTotal, std::memory_order_relaxed);

    if (newTotal >= totalSamplesToRecord)
    {
        // Stop recording and hand off to the message thread via AsyncUpdater.
        // Order matters: store false BEFORE setting recordingComplete so the
        // message thread sees a consistent state.
        isRecording.store(false, std::memory_order_release);
        recordingComplete_.store(true, std::memory_order_release);
        triggerAsyncUpdate();  // safe to call from audio thread
    }
}

// ---------------------------------------------------------------------------
// handleAsyncUpdate — message thread: launch UploadThread
// ---------------------------------------------------------------------------
void VocalMidiProcessor::handleAsyncUpdate()
{
    if (!recordingComplete_.exchange(false))
        return;

    notifyStatus("Encoding and uploading…");
    isUploading.store(true);

    // Copy the recorded buffer so the audio thread can reuse recordingBuffer_
    // for a future recording while the upload is still in progress.
    juce::AudioBuffer<float> snapshot;
    snapshot.makeCopyOf(recordingBuffer_);

    // Kill any previous upload thread before starting a new one
    if (uploadThread_ && uploadThread_->isThreadRunning())
        uploadThread_->stopThread(500);

    const double sr  = currentSampleRate_;
    const juce::String url = serverUrl;

    uploadThread_ = std::make_unique<UploadThread>(
        std::move(snapshot), sr, url,
        [this](UploadThread::Result result)
        {
            // This lambda runs on the message thread (via callAsync in UploadThread::run)
            isUploading.store(false);
            if (result.success)
            {
                notifyStatus("Done — " + result.midiFile.getFileName());
                if (onMidiReceived)
                    onMidiReceived(result.midiFile);
            }
            else
            {
                notifyStatus("Error: " + result.message);
            }
        });

    uploadThread_->startThread();
}

// ---------------------------------------------------------------------------
// startRecording — call from message thread (e.g., button click)
// ---------------------------------------------------------------------------
void VocalMidiProcessor::startRecording()
{
    if (isRecording.load() || isUploading.load())
        return;

    if (totalSamplesToRecord == 0)
    {
        notifyStatus("Error: prepareToPlay not called yet.");
        return;
    }

    recordedSamples.store(0);
    recordingBuffer_.clear();
    recordingComplete_.store(false);
    isRecording.store(true, std::memory_order_release);
    notifyStatus("Recording…  0 / 10 s");
}

// ---------------------------------------------------------------------------
float VocalMidiProcessor::getRecordingProgress() const noexcept
{
    if (totalSamplesToRecord == 0) return 0.0f;
    return static_cast<float>(recordedSamples.load()) /
           static_cast<float>(totalSamplesToRecord);
}

// ---------------------------------------------------------------------------
void VocalMidiProcessor::notifyStatus(const juce::String& msg)
{
    if (onStatusChanged)
        onStatusChanged(msg);
}

// ---------------------------------------------------------------------------
bool VocalMidiProcessor::isBusesLayoutSupported(const BusesLayout& layouts) const
{
    // Accept mono or stereo in, stereo out
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono()
     && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;
    return layouts.getMainInputChannelSet() == layouts.getMainOutputChannelSet();
}

// ---------------------------------------------------------------------------
// Plugin factory — required by JUCE
// ---------------------------------------------------------------------------
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new VocalMidiProcessor();
}
