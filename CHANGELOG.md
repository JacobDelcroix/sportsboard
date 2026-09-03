# Changelog

All notable changes to SportsBoard are documented in this file. The project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.1] - 2026-09-03

### Changed

- Editor and viewer fields now fit both the available container width and height while preserving the active surface ratio.
- Tool and movement buttons are more compact, with clearer spacing between player buttons.
- The tool palette now scrolls independently in short editor containers.
- The playground now includes live width and height controls with desktop, tablet, mobile, and short-container presets.
- Zoom controls are now smaller and anchored to the bottom-right corner of the field.
- Double-clicking or double-tapping an element or movement now opens its editable properties, including the compact-layout Inspector panel.

## [1.1.0] - 2026-09-03

### Changed

- Added proportionate usable space outside the boundary lines of every basketball and football surface.
- Football goals now render outside the playing area within the surrounding grass.
- Basketball coaches now explicitly accept movement endpoints and ball attachment, matching player behavior.
- Newly inserted basketball defenders face away from the basket by default on the half-court surface only.
- Clicking the Ball tool now attaches it immediately to a compatible selected player or coach; drag-and-drop remains free placement.
- Left and right arrow shortcuts now rotate the selected element in ten-degree steps.
- Reduced the additional basketball basket by roughly 18% for better visual balance with players and training equipment.

### Fixed

- Low-level position and rotation updates can no longer bypass disabled `move` or `rotate` permissions.

## [1.0.1] - 2026-08-26

### Fixed

- Published the initial npm package after the unavailable `1.0.0` release attempt.

## [1.0.0] - 2026-08-26

### Added

- Declarative `<sports-board-editor>` and `<sports-board-viewer>` custom elements.
- Basketball and football surfaces, players, equipment, movements, and localized English/French interfaces.
- JSON loading, form association, change/save events, image and thumbnail export.
- Responsive desktop, tablet, mobile, keyboard, touch, zoom, pan, clipboard, and history interactions.
- Extensible Konva registries, custom sports, translations, permissions, and focused npm entry points.

### Quality

- Complete document validation, attachment safety, deterministic semantic layers, and non-destructive connector detachment.
- Automated type checking, tests, package export verification, playground build, and GitHub Actions CI.

[Unreleased]: https://github.com/JacobDelcroix/sportsboard/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/JacobDelcroix/sportsboard/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/JacobDelcroix/sportsboard/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/JacobDelcroix/sportsboard/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/JacobDelcroix/sportsboard/releases/tag/v1.0.0
