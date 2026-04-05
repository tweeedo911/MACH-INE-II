#pragma once
#include <JuceHeader.h>

// ---------------------------------------------------------------------------
// UploadThread — background thread: WAV → base64 → POST → receive MIDI
// ---------------------------------------------------------------------------
class UploadThread final : public juce::Thread
{
public:
    struct Result
    {
        bool        success  = false;
        juce::String message;
        juce::File   midiFile;   // valid only when success == true
    };

    using DoneCallback = std::function<void(Result)>;

    UploadThread(juce::AudioBuffer<float> buffer,
                 double                  sampleRate,
                 juce::String            serverUrl,
                 DoneCallback            onDone);

    void run() override;

private:
    juce::AudioBuffer<float> buffer_;
    double                   sampleRate_;
    juce::String             serverUrl_;
    DoneCallback             onDone_;

    juce::MemoryBlock encodeToWav() const;
    static juce::String toBase64(const juce::MemoryBlock& data);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(UploadThread)
};

// ---------------------------------------------------------------------------
// VocalMidiProcessor
// ---------------------------------------------------------------------------
class VocalMidiProcessor final : public juce::AudioProcessor,
                                 private juce::AsyncUpdater
{
public:
    // ---- public state (read from editor / UI thread) ----------------------
    std::atomic<bool>  isRecording  { false };
    std::atomic<bool>  isUploading  { false };
    std::atomic<int>   recordedSamples { 0 };
    int                totalSamplesToRecord = 0;   // set in prepareToPlay

    // Server URL — editable before recording starts
    juce::String serverUrl { "http://127.0.0.1:8383/process-base64" };

    // Callbacks — set by the editor, called on the message thread
    std::function<void(const juce::String&)> onStatusChanged;
    std::function<void(const juce::File&)>   onMidiReceived;

    // ---- ctor / dtor -------------------------------------------------------
    VocalMidiProcessor();
    ~VocalMidiProcessor() override;

    // ---- recording control (call from message thread) ----------------------
    void startRecording();

    float getRecordingProgress() const noexcept;   // 0.0 … 1.0

    // ---- AudioProcessor interface ------------------------------------------
    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "Vocal MIDI Extractor"; }
    bool   acceptsMidi()  const override { return false; }
    bool   producesMidi() const override { return true;  }
    bool   isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int  getNumPrograms()    override { return 1; }
    int  getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return "Default"; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock&) override {}
    void setStateInformation(const void*, int) override {}

    bool isBusesLayoutSupported(const BusesLayout& layouts) const override;

private:
    static constexpr double kRecordDuration = 10.0;  // seconds

    double                   currentSampleRate_ = 44100.0;
    juce::AudioBuffer<float> recordingBuffer_;

    // Set to true by the audio thread when recording is complete;
    // cleared by handleAsyncUpdate() on the message thread.
    std::atomic<bool> recordingComplete_ { false };

    std::unique_ptr<UploadThread> uploadThread_;

    // Called on the message thread via AsyncUpdater
    void handleAsyncUpdate() override;

    void notifyStatus(const juce::String& msg);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(VocalMidiProcessor)
};
