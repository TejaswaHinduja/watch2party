# Room Page Implementation Notes

This document explains the current implementation in the room experience, including YouTube iframe playback sync and host moderation features.

## 1) Room bootstrap and identity

- The room code is read from the dynamic route: `/room/[roomCode]`.
- Username is read from `sessionStorage`.
- If username is missing, the page shows a simple join prompt and stores the entered username.
- The page uses `useSocket(roomCode, username)` to connect to the backend and join the room.

## 2) YouTube video parsing

- `toYouTubeVideoId()` supports:
- Raw 11-character video IDs
- `youtu.be/<id>` links
- `youtube.com/watch?v=<id>` and similar embed formats
- If parsing fails, the room shows: `No valid video is set for this room yet.`

## 3) YouTube Iframe API lifecycle

- The page loads `https://www.youtube.com/iframe_api` if it is not already present.
- It sets `window.onYouTubeIframeAPIReady` and marks the API as ready.
- Once ready and video ID exists, it creates a `new YT.Player(...)` inside `#room-youtube-player`.
- On cleanup/unmount, it destroys the player instance.

## 4) Playback synchronization behavior

- Backend sends room playback state via `sync_state`:
- `videoId`
- `playState` (`playing` or `paused`)
- `currentTime`
- Client compares local player time with server time and seeks when drift is greater than about 1 second.
- For host users, `onStateChange` emits `play`, `pause`, and `seek` updates.
- Host also emits periodic `seek` updates while playing (every 2 seconds) to keep participants aligned.
- `suppressHostEmitRef` prevents feedback loops when applying remote sync updates locally.

## 5) Host-only control overlay

- For participants, the iframe is covered with a transparent overlay.
- This prevents non-host users from controlling playback directly.
- Hosts have normal controls enabled.

## 6) Participants and role display

- The room displays all connected users from the `user_joined` event payload.
- Each entry shows `username` and role (`HOST` or `PARTICIPANT`).

## 7) New host moderation features

These were added in this update:

- Host can promote a participant to host:
- UI button: `Promote to host`
- Socket event emitted: `promote_participant` with `participantId`
- Backend behavior: promoted user becomes `HOST`, everyone else becomes `PARTICIPANT`

- Host can kick a participant:
- UI button: `Kick`
- Socket event emitted: `kick_participant` with `participantId`
- Backend behavior: target user receives `kicked` event and is removed from room participant list

- If a host leaves and no host remains, backend auto-promotes the first remaining participant as new host.

## 8) Error and kick handling

- Socket hook now listens for:
- `room_error` for room-related issues
- `kicked` for host removal actions
- On `kicked`, room page alerts the user, clears username session storage, and redirects to `/`.

## 9) Landing page join flow

- Landing page now supports explicit `create` and `join` modes.
- Join mode requires username + room code.
- Before navigating, it validates room existence via `GET /api/room/:code`.
- On success, it stores username in session storage and navigates to the room URL.
