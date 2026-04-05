#pragma once
#include <JuceHeader.h>
#include "PluginProcessor.h"

class VocalMidiEditor final : public juce::AudioProcessorEditor,
                              private juce::Timer
{
public:
    explicit VocalMidiEditor(VocalMidiProcessor&);
    ~VocalMidiEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    VocalMidiProcessor& processor_;

    juce::TextButton  recordButton_  { "Record 10 s" };
    juce::ProgressBar progressBar_;
    juce::Label       statusLabel_;
    juce::Label       urlLabel_;
    juce::TextEditor  urlEditor_;

    double progressValue_ = 0.0;  // drives progressBar_ (0.0 … 1.0)

    void timerCallback() override;
    void updateButtonState();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(VocalMidiEditor)
};
