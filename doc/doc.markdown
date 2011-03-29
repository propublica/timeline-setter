# TimelineSetter <%= version %>

TimelineSetter creates beautiful timelines.

It is a command-line utility that takes a [specially-structured CSV file](#csv)
as input and outputs standards-compliant HTML/CSS/JavaScript. It supports any
span of time from minutes to years, and supports multiple parallel event
series in a single timeline. It can handle custom descriptions and even
arbitrary HTML in each event "card." It creates fluid embeds that will look
great at any width.

TimelineSetter "bakes out" timelines, ready for uploading directly into your
CMS, Amazon S3, or however you typically serve static files. It requires no
server-side processing at all once you've generated a timeline.

TimelineSetter [source on Github](https://github.com/propublica/timeline-setter/).

## Assorted Docs and Samples

* TimelineSetter Ruby source [documentation](documentation/index.html)
* timeline-setter.js [annotated source](doc/timeline-setter.html)
* A [sample TimelineSetter timeline](doc/timeline-sample.html)

## How it Works

The project is broken into two parts: a Ruby package (along with a binary) for
generating the assets, and the HTML, CSS and JavaScript for the timeline
itself. TimelineSetter will create a unique HTML page that embeds a JSON
object with your data.The CSS and JavaScript are identical for every timeline
created, so you can host those centrally and simply point to them when you
deploy a timeline, or you can package them up with your HTML and paste it into
your CMS all at once. You can [customize the CSS](#styling) to match the look
and feel of your site.

## Dependencies

TimelineSetter relies on [TableFu](http://propublica.github.com/table-fu/), as
well as the JavaScript libraries
[Underscore](http://documentcloud.github.com/underscore/) and
[jQuery](http://jquery.com/). All of these are either installed along with
TableSetter, or packaged with the source. JQuery is loaded via Google's CDN.
It has been tested with jQuery 1.5.1 and Underscore 1.1.5.

## Installation

Install TimelineSetter through RubyGems on Unix-like OSes:

    gem install timeline_setter
    
(Note: We haven't tested using the TimelineSetter tools on Windows even once,
though the timelines themselves have been tested in modern browsers on
Windows, Mac and Linux.)

## The \`timeline-setter\` command

After TimelineSetter is installed, the `timeline-setter` command should be
available in your shell. The command looks for a CSV file to parse and outputs
static assets. At any point, you can find help by running `timeline-setter`
without any arguments, or by adding the `-h` flag. Run the command like so:

    timeline-setter -c /path/to/data.csv -o /path/to/output/directory

Full list of options:

* `-c CSV` Path to your CSV file.
* `-o OUTPUT_PATH` Path to output timeline and assets.
* `-a` Add the default supporting assets to the output directory, along with the timeline itself.
* `-m` Create a minified one-page version of your timeline with all supporting assets inline.
* `-O` Open a browser to your new timeline after it is generated (currently Mac OS only).
* `-h` Print help to standard output.

<a id="csv"></a>
## Setting Up Your CSV File

TimelineSetter looks for certain column names in your CSV file in order to
generate a timeline. All columns are required, though as you'll see, some of
them can be left blank. Here's a summary of each column and its significance:

### date

The date the event happened. Right now, TimelineSetter only supports
single-date events, but this can be specific down to the second. The generator
will try its best to parse out human dates. Try "March 20, 2010," "3/20/2010,"
"Mar. 20, 2010 11:59 PM" etc.

### display\_date

The date *displayed* on the event's card in the timeline. If this is blank, it
will fall back to `event_date`

### description

A description of the event.

### link

A URL to send users to more details about an event. This will generate a "read
more" button at the bottom of the card pointing to the URL.

### series

A string representing the name of the series of events this particular event
is a part of. TimelineSetter will find all the unique series among events in
the spreadsheet and assign both colors and checkboxes for them at the top of
the spreadsheet. Events not assigned to a series will be part of the "default"
series, which have their timeline notches colored charcoal, and have no
associated checkbox.

### html

Any arbitrary HTML that will be inserted above the `event_description`. This
field may contain image tags, YouTube tags, etc. -- nearly everything except
`<script>` tags. If you choose to use JavaScript, you must do it inside an
iframe and call that iframe inside this field.

## Folder structure and deployment

After you've generated a timeline with the `timeline-setter` command, you
should see a structure much like this where you've specified your output:

      |-output
      |---timeline.html
      |---javascripts
      |-----timeline-setter.js
      |-----vendor
      |-------underscore-min.js
      |-------jquery-min.js      
      |---stylesheets
      |-----timeline-setter.css
      
Dropping the whole folder onto your server or an asset host like S3 will allow
the app to run self-contained. It requires no server-side processing at all.
To drop into your CMS, simply copy the relevant bits of `timeline.html` and
paste into your site's template. Then, adjust the `<link>` and `<script>` tags
to point to their appropriate destinations.

## Definitions

The timeline is made up of non-clickable *interval notches* used to denote
periods of time, and *event notches*, which, when clicked, reveal their
associated *event cards*.

<a name="styling"></a>
## Styling Your Timeline

TimelineSetter timelines are fully style-able. The default "ProPublica theme"
stylesheet is packaged alongside each generated asset bundle, and is available
in `stylesheets/timeline-setter.css`. You can alter this stylesheet, or
replace it completely. Here's a guide to do that.

### Overview and Styling the Container and Top Matter

All TimelineSetter CSS is scoped within a namespace starting with `TS.` The
outermost container is `#timeline_setter.`

Upon first glance, it may not seem like there is much markup at all. That's
because we make extensive use of JavaScript (ERB-style) templating via
[Underscore.js](http://documentcloud.github.com/underscore/#template) -- so
templates for each part of the timeline reside in the DOM. The controls (zoom
in/out, previous/next buttons) are available within `#TS-top_matter_container .TS-controls`.

Series checkboxes are injected into `.TS-series_nav_container` and templated
via `script#TS-notch_tmpl`. Currently, series colors are hard coded in the
JavaScript. We support a maximum of nine series colors (assigned in this order:
``#065718, #EDC047, #91ADD1, #929E5E, #9E5E23, #C44846, #065718, #EDD4A5, #CECECE``,
check `CardContainer.colors` in timeline-setter.js to override). Technically
you can create an unlimited number of series, but they will eventually fall back
to the default charcoal notch color.

### Styling the bar, notches and cards

Interval notches are templated within `script#TS-year_notch_tmpl`. Their
position is based on the interval of time between events as automatically
determined by the JavaScript. Here's a sampling of what you might see in
interval notches:

    year        => 2001
    month       => June, 2004
    day         => May 1, 2005
    hour/minute => 11:59
    second      => 11:59:22

Event notches are templated through `#TS-card-tmpl` and contain individual
classes corresponding to spreadsheet columns. `.TS-item-label` corresponds to
`description`, `.TS-item_html` corresponds to `event_html`,
`.TS-read_btn` is linked to `link` and `.TS-item_year` corresponds to
`display_date` falling through to `date`. Finally, `TS-permalink`
is a fragment link which will show the active card on page load if used.

## Roadmap

On the client side, there are a number of features we plan to add, including:

* Smoother zooming
* Deactivating series checkboxes if none of its events are within the zoomed viewport
* Auto-zooming the timeline if embedded into smaller containers
* More iOS gestures such as "pinching"
* Zooming to fit a series when the series is activated
* Ranges of events (e.g. Elizabeth Taylor was married to Michael Wilding between
  Feb. 21, 1952 and Jan. 26, 1957, as shown 
  [here](http://www.nytimes.com/interactive/2011/03/23/movies/20110323-ELIZABETH-TAYLOR-TIMELINE.html))
* Embed code
* JavaScript tests

## Links

* In the Wild: [ProPublica: How One Blast Affected Five Soldiers](http://www.propublica.org/special/tbi-psycho-platoon-timeline)

## Credits

[Al Shaw](http://twitter.com/a_l), [Jeff Larson](http://github.com/thejefflarson), ProPublica

## Contact

For issues with TimelineSetter, use the 
[Issue Tracker](https://github.com/propublica/timeline-setter/issues). General 
questions should go to <a href="mailto:opensource@propublica.org">opensource@propublica.org</a>.

## Change Log

### 0.0.1

Initial release

## License 

<%= license %>