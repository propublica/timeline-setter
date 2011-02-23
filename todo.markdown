# TimelineSetter ToDo

## Features
* "disable" buttons if you can't do them
* Add support for 'series' of data (color coded). Sniff out series, and toggle view by series
* Allow different types of media. Expand cards to fit.
* Next/Previous card buttons (figure out how to jive this with hover. Move to click instead?)
* Per-card permalinks
* scrollwheel, dragscrolling, etc
* make periodic notches work in intervals < 1 year
* add to CLI to "install" all assets for a timeline in any folder

## Bugs
* don't allow scrolling 'off the side' when zoomed in
* make cards fly out correctly when notches are near edges (right now, they go off the page)
* make sure card arrows stick to card and line up with notches
 
 
## Notes

* use notch $.offset to position cards
* use scrub after zoom to recenter