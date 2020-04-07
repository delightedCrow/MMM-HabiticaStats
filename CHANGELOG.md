# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Nothing yet :)

## 1.3.0 - 2020-4-6
### Added
- Added the latest MMM-HabiticaStats version number to the xclient header so Habitica can tell which versions of MMM-HabiticaStats are making which calls.

### Fixed
- Adding in a guard so that refreshRate for accessing the API cannot be set lower than 30 seconds in the config.
- Fixing error where we were using setInterval instead of setTimeout in our scheduleUpdate function, resulting in too many requests to the Habitica API over time (fixes issue #1)

## 1.2.0 - 2019-11-15
### Changed
- Updating to HabiticaMagic-v2.0.1 to fix mage class title and icons.
- Changed header icon to FontAwesome Scroll to better fit Habitica's image guidelines.
- Cleaning up screenshots.

### Added
- Now displays a "loading..." message while data is being fetched for the first time.

## 1.1.0 - 2019-11-4
### Added
- The changelog file :)
- Error handling and error display messages.

### Changed
- Updated to (HabiticaMagicJS 2.0.0)[https://github.com/delightedCrow/HabiticaMagic].

## 1.0.0 - 2019-10-29
The Initial Release.
