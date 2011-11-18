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

<a id="samples"></a>
## Assorted Docs and Samples

* TimelineSetter Ruby source [documentation](documentation/index.html)
* timeline-setter.js [annotated source](doc/timeline-setter.html)
* A [TimelineSetter demo](doc/twitter-demo.html) using Twitter data

<a id="innards"></a>
## How it Works

The project is broken into two parts: a Ruby package (along with a binary) for
generating the assets, and the HTML, CSS and JavaScript for the timeline
itself. TimelineSetter will create a unique HTML page that embeds a JSON
object with your data. The CSS and JavaScript are identical for every timeline
created, so you can host those centrally and simply point to them when you
deploy a timeline, or (with the minified option) you can package them up with your HTML 
and paste it into your CMS all at once. You can [customize the CSS](#styling) to match the look
and feel of your site.

<a id="deps"></a>
## Dependencies

TimelineSetter relies on [TableFu](http://propublica.github.com/table-fu/), as
well as the JavaScript libraries
[Underscore](http://documentcloud.github.com/underscore/) and
[jQuery](http://jquery.com/). All of these are either installed along with
TableSetter, or packaged with the source. It has been tested with jQuery 1.5.1 
and Underscore 1.1.5.

<a id="install"></a>
## Installation

Install TimelineSetter through RubyGems on Unix-like OSes:

    gem install timeline_setter
    
(Note: We haven't tested using the TimelineSetter tools on Windows even once,
though the timelines themselves have been tested in modern browsers on
Windows, Mac and Linux.)

<a id="commandline"></a>
## The \`timeline-setter\` command

After TimelineSetter is installed, the `timeline-setter` command should be
available in your shell. The command looks for a CSV file to parse and outputs
static assets. At any point, you can find help by running `timeline-setter`
without any arguments, or by adding the `-h` flag. Run the command like so:

    timeline-setter -c /path/to/data.csv -o /path/to/output/directory

Running `timeline-setter` with no `-o` option will generate the timeline (and 
supporting assets if applicable) within the current directory.

Full list of options:

* `-c CSV` Path to your CSV file.
* `-o OUTPUT_PATH` Path to output timeline and assets. If absent, timeline will be created in current directory.
* `-a` Do not output supporting assets such as CSS and JavaScript. This is useful if you're customizing those and don't want your versions clobbered.
* `-m` Create a minified one-page version of your timeline with all supporting assets inline.
* `-O` Open a browser to your new timeline after it is generated (currently Mac OS only).
* `-i` Add a custom interval for background "interval notches." These take the format of JavaScript date [getter methods](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date#Methods). For example, year would be `FullYear.` All the options are available [below](#interval_notch_options). If absent, TimelineSetter will attempt to automatically create interval notches based on the first and last dates in your timeline.
* `-h` Print help to standard output.

<a id="csv"></a>
## Setting Up Your CSV File

TimelineSetter looks for certain column names in your CSV file in order to
generate a timeline. All columns are required, though as you'll see, some of
them can be left blank (see a [sample CSV](https://github.com/propublica/timeline-setter/blob/master/spec/test_data.csv)). Here's a summary of each column and its significance:

<a id="date-csv"></a>
### date

The date the event happened. Right now, TimelineSetter only supports
single-date events, but this can be specific down to the second. The generator
will try its best to parse out human dates. Try "March 20, 2010," "3/20/2010,"
"Mar. 20, 2010 11:59 PM" etc.

<a id="display-date-csv"></a>
### display\_date

The date *displayed* on the event's card in the timeline. If this is blank, it
will fall back to `date`

<a id="desc-csv"></a>
### description

A description of the event.

<a id="link-csv"></a>
### link

A URL to send users to more details about an event. This will generate a "read
more" button at the bottom of the card pointing to the URL.

<a id="series-csv"></a>
### series

A string representing the name of the series of events this particular event
is a part of. TimelineSetter will find all the unique series among events in
the spreadsheet and assign both colors and checkboxes for them at the top of
the spreadsheet. Events not assigned to a series will be part of the "default"
series, which have their timeline notches colored charcoal, and have no
associated checkbox. **Note:** As a corollary, if you only have one series, it is
best not to assign a name.

<a id="html-csv"></a>
### html

Any arbitrary HTML that will be inserted above `description`. This
field may contain image tags, YouTube tags, etc. -- nearly everything except
`<script>` tags. If you choose to use JavaScript, you must do it inside an
iframe and call that iframe inside this field. **Note**: If you put an image or iframe in this field, make sure to set `height` and `width` attributes, or the card may not extend around the image.

<a id="deployment"></a>
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

<a id="defn"></a>
## Definitions

The timeline is made up of non-clickable *interval notches* used to denote
periods of time, and *event notches*, which, when clicked, reveal their
associated *event cards*.

<a id="configuring"></a>
## Configuring the Timeline JavaScript Embed

Although the `timeline-setter` command generates a JavaScript embed that prepopulates your data, you can also create this yourself by calling `TimelineSetter.timeline.boot` with an array of card objects, and a config object.

    var myTimeline = TimelineSetter.Timeline.boot([{card}...], {config})

The config object looks for `interval`, `container`, and `formatter` options. 

The `interval` option takes an [interval](#interval_notch_options) in the form of a JavaScript date getter. The `container` option allows you to inject the entire timeline into an element with the given selector. (By default this is `#timeline`). Finally, `formatter` is a way to format dates on the timeline's interval notches. Write a formatter like so:

    formatter : function(d, defaults) {
      var months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      defaults.month = months[d.getMonth()];
      return defaults;     
    }



<a name="styling"></a>
## Styling Your Timeline

TimelineSetter timelines are fully style-able. The default "ProPublica theme"
stylesheet is packaged alongside each generated asset bundle, and is available
in `stylesheets/timeline-setter.css`. You can alter this stylesheet, or
replace it completely. Here's a guide to do that.

<a id="styling-container"></a>
### Overview and Styling the Container and Top Matter

All TimelineSetter CSS is scoped within a namespace starting with `TS` except for the outermost container (by default `#timeline`.) The container is configurable with the `container` argument in the TimelineSetter boot function's config object.

Upon first glance, it may not seem like there is much markup at all. That's
because we make extensive use of JavaScript (ERB-style) templating via
[Underscore.js](http://documentcloud.github.com/underscore/#template) --
templates for each part of the timeline reside in a JST object at the end of timeline-setter.js.

Currently, series colors are hard coded in the
JavaScript. We support a maximum of nine series colors (assigned in this order:
``#065718, #EDC047, #91ADD1, #929E5E, #9E5E23, #C44846, #465363, #EDD4A5, #CECECE``,
they can be overridden in the "color priority" section of `timeline-setter.css`). Technically
you can create an unlimited number of series, but they will eventually fall back
to the default charcoal notch color.

<a id="styling-bar"></a>
### Styling the bar, notches and cards

The position of interval notches is based on the interval of time between events as automatically determined by the JavaScript. Here's a sampling of what you might see in interval notches:

    year        => 2001
    month       => June, 2004
    day         => May 1, 2005
    hour/minute => 11:59
    second      => 11:59:22

<a id="interval_notch_options"></a>
The interval notches date spans themselves can be customized by using the `-i` flag when generating a timeline. The available parameters are
    
    Decade
    Lustrum 
    FullYear
    Month
    Week  
    Date   
    Hours 
    Minutes
    Seconds

<a id="js_api"></a>
## The JavaScript API

As of version 0.3.0, TimelineSetter has a JavaScript API that allows programmatic access to certain events, and the ability to activate cards. To use the API, assign the `TimelineSetter.Timeline.boot()` function to a variable, and then use methods in the `api` object like so:

    var currentTimeline = TimelineSetter.Timeline.boot(options);
    currentTimeline.api.onLoad(function() { 
      console.log("I'm ready")
    });

Here are the API methods:

### onLoad

Register a callback for when the timeline is loaded.

### onCardAdd

Register a callback for when a card is added to the timeline. This method has access to the event name and the card object.

    currentTimeline.api.onCardAdd(function(evtName, obj) {
      console.log(obj);
    });

### onCardActivate

Register a callback for when a card is activated (i.e. shown). This method has access to the event name and the card object.

### onBarMove

Register a callback for when the bar is moved or zoomed. Be careful with this one: Bar move events can be fast and furious, especially with scroll wheels in Safari.

### activateCard

Show the card matching a given timestamp. Right now, timelines only support one card per timestamp.

<a id="roadmap"></a>
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

<a id="orgs"></a>
## Media Organizations Using TimelineSetter

* [ProPublica](http://www.propublica.org/special/tbi-psycho-platoon-timeline)
* [Los Angeles Times](http://timelines.latimes.com/bell/)
* [Chicago Tribune](http://www.chicagotribune.com/news/local/chi-taxi-ts-docs-20111118,0,3641202.htmlstory)
* [Huffington Post](http://www.huffingtonpost.com/2011/09/09/ground-zero-world-trade-center-freedom-tower_n_955845.html)
* [Talking Points Memo](http://www.talkingpointsmemo.com/interactive/2011/04/the-wisconsin-union-struggle-timeline.php)
* [MinnPost](http://www.minnpost.com/bachmanntimeline/)
* [Milwaukee Journal-Sentinel](http://www.jsonline.com/news/129159038.html)
* [WNYC](http://www.wnyc.org/articles/its-free-country/2011/may/20/timeline-gay-marriage-nystate/)
* [ArtInfo](http://www.artinfo.com/news/story/37506/getting-to-know-ai-weiwei-a-multimedia-biographical-timeline/)
* [Global TV News (Canada)](http://www.globalnews.ca/afghanistan/timeline/index.html?utm_source=facebook-twitter&utm_medium=link&utm_campaign=community)
* [PBS Newshour](http://www.pbs.org/newshour/timeline/uprising/)
* [American Public Media: Marketplace](http://www.marketplace.org/topics/economy/raising-debt-ceiling)

<a id="credits"></a>
## Credits

[Al Shaw](http://github.com/ashaw), [Jeff Larson](http://github.com/thejefflarson), ProPublica, [Ben Welsh](http://github.com/palewire), Los Angeles Times

<a id="contact"></a>
## Contact

For issues with TimelineSetter, use the 
[Issue Tracker](https://github.com/propublica/timeline-setter/issues). General 
questions should go to <a href="mailto:opensource@propublica.org">opensource@propublica.org</a>.

<a id="changelog"></a>
## Change Log

<a id="release-030"></a>
### 0.3.0

* Add JavaScript API
* Scope timeline to a given element to support multiple timelines on a page
* Add date formatter config option. _Thanks [@omega](https://github.com/propublica/timeline-setter/pull/26)_

<a id="release-020"></a>
### 0.2.0

* New feature adds support for custom interval notch ranges.
* Change command line to output supporting assets by default unless `-a` is specified

<a id="release-012"></a>
### 0.1.2

* Support for decade and lustrum (five year period) interval notches. _Thanks, [Ben Welsh](http://github.com/palewire)_


<a id="release-011"></a>
### 0.1.1

* Made JavaScript smarter about image widths, so now images can be used without specifying height and width attributes
* Fixed "read more" buttons so they can be clicked everywhere, not just on the text
* Fixed a CLI bug where timeline was being put in the wrong place when output directory is specified without a trailing slash
* Fixed duplicate colors in CSS
* Fixed layout rendering problems when a card was more than half the size of the timeline
* Fixed an issue where JSON couldn't be generated in Ruby 1.9

_Thanks to [Ben Welsh](http://github.com/palewire) for pointing out most of these issues_

<a id="release-010"></a>
### 0.1.0

Initial release

<a id="license"></a>
## License 

<%= license %>