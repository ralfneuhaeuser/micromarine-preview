# MicroMotion – interactive model-control demo

Build `demo-2026.11.25.1`. A simulation-only browser presentation: no vehicle, firmware, serial, Bluetooth or actuator connection. All course/altitude/feedback values are illustrative, not measured flight data.

Choose boats, an indoor flyer, a light aircraft or a glider. Flight views offer mirrored hand arrangement, classic or device-tilt input, volatile trims, lights and an explicitly simulated autopilot with a gust demonstration. Glider control uses spoilers instead of a motor. Graphite, riveted and brushed-aluminium flight finishes are selectable.

Tilt control requires HTTPS, supported sensors and explicit browser permission where requested. Inputs remain local. Real iPhone sensor/multitouch validation is still pending. Autopilot and tilt input are mutually exclusive; a gust cannot override tilt input. STOPP resets simulated outputs and trims. This is not a safety-certified emergency stop or a real flight-control system.

Settings share hand arrangement and reduced motion across layouts; vehicle curves on the settings page still apply to boats. Flight trims and sensor neutral are volatile. No account, tracking or mandatory cloud service. Loading the hosted demo needs a network connection; a full offline cache is not provided.

Reproducible build sources are retained in the separate development project. Runtime file hashes: `release-manifest.json`. Logic checks: `node --test test_config.cjs test_flight.cjs` (29 passing checks on 25 November 2026). Browser layout tests do not prove real hardware behavior.

This consolidation branch is a source review checkpoint, not an automatic change to the published main branch. No new software license or product availability is declared.
