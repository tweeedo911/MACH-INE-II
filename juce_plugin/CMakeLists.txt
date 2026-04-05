cmake_minimum_required(VERSION 3.22)
project(VocalMidiExtractor VERSION 1.0.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ---------------------------------------------------------------------------
# JUCE — set JUCE_PATH to a local SDK dir to skip the network fetch.
#   cmake -DJUCE_PATH=/path/to/JUCE ..
# ---------------------------------------------------------------------------
set(JUCE_PATH "" CACHE PATH "Local JUCE SDK path (leave empty to fetch from GitHub)")

if(JUCE_PATH STREQUAL "")
    include(FetchContent)
    FetchContent_Declare(
        JUCE
        GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
        GIT_TAG        7.0.12
        GIT_SHALLOW    TRUE
    )
    FetchContent_MakeAvailable(JUCE)
else()
    add_subdirectory("${JUCE_PATH}" "${CMAKE_BINARY_DIR}/JUCE")
endif()

# ---------------------------------------------------------------------------
# Plugin target
# ---------------------------------------------------------------------------
juce_add_plugin(VocalMidiExtractor
    COMPANY_NAME            "MACH-INE"
    PLUGIN_MANUFACTURER_CODE Mach
    PLUGIN_CODE             Vme1
    FORMATS                 VST3 AU Standalone
    PRODUCT_NAME            "Vocal MIDI Extractor"
    IS_SYNTH                FALSE
    NEEDS_MIDI_INPUT        FALSE
    NEEDS_MIDI_OUTPUT       TRUE
    IS_MIDI_EFFECT          FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
)

target_sources(VocalMidiExtractor
    PRIVATE
        Source/PluginProcessor.cpp
        Source/PluginEditor.cpp
)

target_compile_definitions(VocalMidiExtractor
    PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0          # use platform-native HTTP (NSURLSession / WinInet)
        JUCE_VST3_CAN_REPLACE_VST2=0
        JUCE_DISPLAY_SPLASH_SCREEN=0
)

target_link_libraries(VocalMidiExtractor
    PRIVATE
        juce::juce_audio_utils      # pulls in audio_basics, audio_formats, gui_basics, …
        juce::juce_audio_formats    # WavAudioFormat
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# ---------------------------------------------------------------------------
# Build instructions (printed once at configure time)
# ---------------------------------------------------------------------------
message(STATUS "")
message(STATUS "  Build:   cmake --build . --config Release")
message(STATUS "  VST3 →   VocalMidiExtractor_artefacts/Release/VST3/")
message(STATUS "  Server:  uvicorn api_server:app --port 8383  (in repo root)")
message(STATUS "")
