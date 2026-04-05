#include "PluginEditor.h"

VocalMidiEditor::VocalMidiEditor(VocalMidiProcessor& p)
    : AudioProcessorEditor(&p), processor_(p), progressBar_(progressValue_)
{
    setSize(400, 220);

    // --- URL editor ---------------------------------------------------------
    urlLabel_.setText("Server URL", juce::dontSendNotification);
    urlLabel_.setFont(juce::Font(13.0f));
    addAndMakeVisible(urlLabel_);

    urlEditor_.setText(processor_.serverUrl);
    urlEditor_.onReturnKey = [this]
    {
        processor_.serverUrl = urlEditor_.getText().trim();
    };
    urlEditor_.onFocusLost = [this]
    {
        processor_.serverUrl = urlEditor_.getText().trim();
    };
    addAndMakeVisible(urlEditor_);

    // --- Record button ------------------------------------------------------
    recordButton_.onClick = [this]
    {
        processor_.serverUrl = urlEditor_.getText().trim();
        processor_.startRecording();
    };
    addAndMakeVisible(recordButton_);

    // --- Progress bar -------------------------------------------------------
    progressBar_.setPercentageDisplay(true);
    addAndMakeVisible(progressBar_);

    // --- Status label -------------------------------------------------------
    statusLabel_.setText("Ready.", juce::dontSendNotification);
    statusLabel_.setFont(juce::Font(12.0f));
    statusLabel_.setJustificationType(juce::Justification::centredLeft);
    addAndMakeVisible(statusLabel_);

    // --- Callbacks from processor (message thread) --------------------------
    processor_.onStatusChanged = [this](const juce::String& msg)
    {
        statusLabel_.setText(msg, juce::dontSendNotification);
        updateButtonState();
    };

    processor_.onMidiReceived = [this](const juce::File& midiFile)
    {
        statusLabel_.setText("Saved: " + midiFile.getFileName(),
                             juce::dontSendNotification);
        updateButtonState();
    };

    // Poll progress at ~15 fps
    startTimerHz(15);
    updateButtonState();
}

VocalMidiEditor::~VocalMidiEditor()
{
    stopTimer();
    processor_.onStatusChanged = nullptr;
    processor_.onMidiReceived  = nullptr;
}

// ---------------------------------------------------------------------------
void VocalMidiEditor::timerCallback()
{
    progressValue_ = static_cast<double>(processor_.getRecordingProgress());
    progressBar_.repaint();
    updateButtonState();
}

void VocalMidiEditor::updateButtonState()
{
    const bool busy = processor_.isRecording.load() || processor_.isUploading.load();
    recordButton_.setEnabled(!busy);
    recordButton_.setButtonText(
        processor_.isRecording.load()  ? "Recording…" :
        processor_.isUploading.load()  ? "Uploading…" :
                                         "Record 10 s & Analyze");
}

// ---------------------------------------------------------------------------
void VocalMidiEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff1e1e2e));

    g.setColour(juce::Colours::white);
    g.setFont(juce::Font(17.0f, juce::Font::bold));
    g.drawText("Vocal MIDI Extractor", getLocalBounds().removeFromTop(36),
               juce::Justification::centred);
}

void VocalMidiEditor::resized()
{
    auto area = getLocalBounds().reduced(16);
    area.removeFromTop(36);   // title space

    urlLabel_ .setBounds(area.removeFromTop(18));
    area.removeFromTop(4);
    urlEditor_.setBounds(area.removeFromTop(24));
    area.removeFromTop(12);

    recordButton_.setBounds(area.removeFromTop(36));
    area.removeFromTop(10);

    progressBar_.setBounds(area.removeFromTop(22));
    area.removeFromTop(8);

    statusLabel_.setBounds(area.removeFromTop(20));
}

// ---------------------------------------------------------------------------
// Required by PluginProcessor.cpp — editor factory
// ---------------------------------------------------------------------------
juce::AudioProcessorEditor* VocalMidiProcessor::createEditor()
{
    return new VocalMidiEditor(*this);
}
