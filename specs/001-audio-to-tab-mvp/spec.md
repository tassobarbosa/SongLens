# Feature Specification: Audio-to-Tab MVP

**Feature Branch**: `001-audio-to-tab-mvp`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "SongLens — AI-Powered Music Practice Platform. Build a web app that helps beginner and intermediate musicians learn songs by automatically converting uploaded audio into interactive guitar tablature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Song and View Guitar Tab (Priority: P1)

A beginner guitarist hears a song they want to learn. They open SongLens, upload the song file (MP3 or WAV), and wait while the system processes it. Once processing completes, the system displays an interactive guitar tablature derived from the song's vocal melody. The user can scroll through the tab, see fret numbers on each string, and understand what notes to play.

**Why this priority**: This is the core value proposition — transforming audio into usable guitar tablature. Without this, the product has no reason to exist. Every other feature depends on the transcription being generated and displayed.

**Independent Test**: Can be fully tested by uploading a known song with a clear vocal melody and verifying the generated tab matches expected notes. Delivers immediate value — a musician gets a playable tab from any audio file.

**Acceptance Scenarios**:

1. **Given** a user is on the upload page, **When** they select an MP3 file under 50 MB and confirm upload, **Then** the system accepts the file and shows a processing progress indicator.
2. **Given** a song has finished processing, **When** the user views the results, **Then** a guitar tablature is displayed showing fret numbers across six strings in standard tuning.
3. **Given** the generated tablature is displayed, **When** the user scrolls through it, **Then** the tab renders smoothly with measures, beat markers, and readable fret positions.
4. **Given** a song with a clear single vocal melody, **When** the system generates a tab, **Then** the pitch accuracy of transcribed notes is at least 80% when compared against a reference transcription.
5. **Given** a user uploads a WAV file, **When** processing completes, **Then** the same tablature view is produced as with an equivalent MP3 upload.

---

### User Story 2 - Separate and Download Instrumental Track (Priority: P2)

A musician wants to practice playing along with a song without the original vocals. They upload a song, and the system separates the vocals from the instrumental backing. The user can then download the instrumental-only version as an audio file to use during practice.

**Why this priority**: Vocal/instrumental separation is a prerequisite for accurate vocal transcription (Story 1) and provides standalone value — musicians frequently want instrumental backing tracks for practice.

**Independent Test**: Can be tested by uploading a song with clear vocals and instruments, then downloading the instrumental track and verifying vocals are significantly reduced. Delivers value independently — a musician gets a karaoke-style backing track.

**Acceptance Scenarios**:

1. **Given** a song has been uploaded and processed, **When** the user requests the instrumental download, **Then** an audio file is provided with vocals substantially removed.
2. **Given** the instrumental file is downloaded, **When** the user plays it, **Then** the instrumental elements (drums, bass, guitar, keys) remain largely intact and audible.
3. **Given** a song with clear vocals over an instrumental arrangement, **When** separation is performed, **Then** the isolated vocal track is clean enough for accurate pitch detection.

---

### User Story 3 - Play Back Transcription as MIDI (Priority: P3)

A musician viewing a generated guitar tab wants to hear what it sounds like before attempting to play it. They press a play button and hear the transcription rendered as MIDI audio. The tablature highlights the current note during playback, and a playhead moves across the tab in sync with the audio. The user can pause, resume, and seek to any position.

**Why this priority**: Hearing the transcription confirms whether the tab is accurate and helps the musician internalize the melody before practicing. This transforms a static tab into an interactive learning tool.

**Independent Test**: Can be tested by generating a tab, pressing play, and verifying that MIDI audio plays in sync with visual note highlighting. Delivers value independently — a musician can aurally preview any generated tab.

**Acceptance Scenarios**:

1. **Given** a tablature is displayed, **When** the user presses Play, **Then** MIDI audio begins playing from the start of the tab.
2. **Given** MIDI playback is active, **When** a note is reached in the timeline, **Then** the corresponding fret position on the tab is visually highlighted.
3. **Given** MIDI playback is active, **When** the user presses Pause, **Then** playback stops at the current position and can be resumed.
4. **Given** the user is viewing a tab (playing or paused), **When** they click/tap on a specific measure, **Then** the playhead jumps to that position.
5. **Given** MIDI playback is active, **When** the tab extends beyond the visible area, **Then** the view auto-scrolls smoothly to keep the playhead centered.

---

### User Story 4 - Transcription Confidence and Quality Warnings (Priority: P4)

A user uploads a song that contains challenging audio characteristics (multiple singers, heavy distortion, choir, or rap/spoken vocals). After processing, the system displays confidence scores and specific warnings about factors that may have reduced transcription accuracy, so the user knows to verify the tab more carefully.

**Why this priority**: Transcription accuracy is the biggest risk. Transparently communicating confidence prevents user frustration when tabs are less accurate due to difficult source material.

**Independent Test**: Can be tested by uploading songs with known challenging characteristics and verifying appropriate warnings appear. Delivers value independently — sets user expectations correctly.

**Acceptance Scenarios**:

1. **Given** a song with a single clear vocal melody has been processed, **When** the user views the results, **Then** an overall confidence score is displayed (e.g., "High", "Medium", "Low").
2. **Given** a song with multiple overlapping vocal parts, **When** processing completes, **Then** a warning is displayed indicating "Multiple singers detected — tab may represent a blended melody."
3. **Given** a song with heavy distortion or non-tonal content, **When** processing completes, **Then** a warning indicates that pitch detection reliability is reduced.
4. **Given** a song with rap or spoken-word vocals, **When** processing completes, **Then** a warning indicates that melodic transcription may not be meaningful for spoken content.

---

### User Story 5 - Listen to Instrumental with MIDI Overlay (Priority: P5)

A musician wants to practice by hearing the separated instrumental track with the MIDI transcription playing on top, similar to a guided practice session. They select the "Instrumental + MIDI" listening mode and hear both the backing track and the synthesized melody together, with the tab highlighting notes in sync.

**Why this priority**: Combines Stories 2 and 3 into the ideal practice experience — hearing the song's backing while following along with the generated melody. Lower priority because it depends on both separation and MIDI playback working first.

**Independent Test**: Can be tested by selecting the combined mode and verifying both audio streams play in sync with tab highlighting. Delivers value — simulates playing along with the band while a guide melody shows the way.

**Acceptance Scenarios**:

1. **Given** a song has been processed with both separation and transcription complete, **When** the user selects "Instrumental + MIDI" mode, **Then** both the instrumental audio and MIDI playback begin simultaneously.
2. **Given** the combined mode is playing, **When** the user adjusts playback position, **Then** both the instrumental audio and MIDI stay synchronized.
3. **Given** the combined mode is playing, **When** notes are reached, **Then** the tab highlights notes in sync with both audio streams.

---

### Edge Cases

- What happens when a user uploads a file that is not a valid audio file (e.g., a renamed text file)?
- What happens when a user uploads an audio file that exceeds the maximum allowed size?
- What happens when a purely instrumental song with no vocals is uploaded?
- What happens when an extremely short audio clip (under 5 seconds) is uploaded?
- What happens when an extremely long audio file (over 15 minutes) is uploaded?
- How does the system handle corrupt or truncated audio files?
- What happens when audio processing fails partway through (e.g., separation succeeds but transcription fails)?
- How does the system handle songs in non-standard tunings or keys?
- What happens when the user's browser does not support required audio playback capabilities?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept audio file uploads in MP3 and WAV formats.
- **FR-002**: System MUST validate uploaded files and reject non-audio files with a clear error message.
- **FR-003**: System MUST enforce a maximum file size limit and inform the user of the limit before and during upload.
- **FR-004**: System MUST separate an uploaded audio file into isolated vocal and instrumental tracks.
- **FR-005**: System MUST generate a vocal pitch transcription from the isolated vocal track, detecting pitch, timing, and note duration.
- **FR-006**: System MUST convert the vocal pitch transcription into guitar tablature using realistic fret positions and fingerings in standard tuning (EADGBE).
- **FR-007**: System MUST display the generated guitar tablature in an interactive viewer showing six strings with fret numbers, measure divisions, and beat markers.
- **FR-008**: System MUST support smooth scrolling through the tablature, both manually and automatically during playback.
- **FR-009**: System MUST allow the user to download the separated instrumental track as an audio file.
- **FR-010**: System MUST render the transcription as MIDI audio that the user can play, pause, and seek through.
- **FR-011**: System MUST visually highlight the current note on the tablature during MIDI playback with a synchronized playhead.
- **FR-012**: System MUST display a confidence score for each processed song indicating overall transcription reliability.
- **FR-013**: System MUST detect and warn users about challenging audio characteristics: multiple singers, choir/harmony, heavy distortion, and rap/spoken vocals.
- **FR-014**: System MUST provide an "Instrumental + MIDI" listening mode that plays the separated instrumental and MIDI transcription simultaneously in sync.
- **FR-015**: System MUST show processing progress to the user during audio analysis (upload, separation, transcription, tab generation).
- **FR-016**: System MUST handle processing failures gracefully, informing the user which step failed and suggesting corrective actions.
- **FR-017**: System MUST persist uploaded songs and their processing results locally so users can return to previously processed songs without re-uploading.
- **FR-018**: System MUST function as an installable Progressive Web App with offline access to previously processed songs and the core app shell.

### Key Entities

- **Song**: An uploaded audio file with its metadata (name, duration, file size, upload date). A Song is the root entity from which all processing artifacts derive.
- **Vocal Track**: The isolated vocal audio extracted from a Song via source separation. Used as input for pitch transcription.
- **Instrumental Track**: The isolated non-vocal audio extracted from a Song. Available for download and use in combined playback modes.
- **Transcription**: A sequence of detected notes from the Vocal Track, each with pitch, start time, duration, and confidence. Represents the raw musical data before tab conversion.
- **Guitar Tab**: The Transcription converted into guitar tablature format — a sequence of fret positions mapped to six strings, organized into measures and beats. This is the primary output displayed to the user.
- **Confidence Report**: Metadata about the processing results including overall confidence score and specific warnings about detected audio characteristics that may affect accuracy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can upload a song and view a generated guitar tab within 3 minutes of upload for a typical 4-minute song.
- **SC-002**: Transcription pitch accuracy reaches at least 80% on songs with a single clear vocal melody when compared against reference transcriptions.
- **SC-003**: Generated tablature uses physically playable fret positions — no fret number exceeds 24, and sequential notes do not require impossible hand jumps (e.g., fret 1 to fret 20 within a single beat).
- **SC-004**: Users can play, pause, and seek through MIDI playback with note highlighting responding within 200 milliseconds of the playhead position.
- **SC-005**: The instrumental download preserves audible instrumental elements while reducing vocal presence by at least 80% in subjective listening tests.
- **SC-006**: The application loads and becomes interactive within 3 seconds on a standard broadband connection.
- **SC-007**: Previously processed songs are accessible offline without re-uploading or re-processing.
- **SC-008**: Users encountering difficult audio characteristics (multiple singers, distortion, spoken word) see relevant warnings before relying on the generated tab.
- **SC-009**: 90% of users with basic guitar knowledge can follow a generated tab and identify the correct melody on first attempt for songs with clear vocal lines.
- **SC-010**: The application is installable as a PWA and scores 90+ on Lighthouse PWA audit.

## Assumptions

- Users are beginner to intermediate guitarists who can read standard guitar tablature notation.
- Users have access to a modern web browser (latest 2 versions of Chrome, Firefox, Safari, or Edge) on desktop or mobile.
- Uploaded songs will predominantly feature Western popular music with a single lead vocal melody over instrumental accompaniment.
- Standard guitar tuning (EADGBE) is assumed for all generated tabs; alternate tunings are out of scope for the MVP.
- Audio processing (separation, transcription) may be computationally intensive; users accept a processing wait time proportional to song length.
- The maximum practical song length for processing is approximately 10 minutes; longer files may be accepted but with degraded processing time.
- The system processes one song at a time per user session; batch processing is out of scope.
- All processing occurs client-side or via local computation; no user accounts, cloud storage, or server-side APIs are required for the MVP.
- Social features (profiles, comments, sharing, song libraries shared between users) are explicitly out of scope.
- The transcription targets the primary vocal melody only; harmony parts, backing vocals, and instrumental solos are not transcribed in the MVP.
- MIDI playback uses a basic guitar-like synthesized sound; high-fidelity instrument modeling is out of scope.
- The confidence scoring system uses heuristics based on audio analysis characteristics rather than requiring a labeled training dataset.
