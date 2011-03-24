# TimelineSetter

TimelineSetter is a command-line utility to create beautiful standards-compliant timelines from spreadsheets. It supports any range of time, from minutes to years, custom descriptions and arbitrary HTML in event cards. It creates fluid embeds that will look great in any sized container.

The project is broken into two parts: a Ruby backend (along with a binary) for generating the assets, and the Timeline HTML, CSS and JavaScript itself which are nearly identical for every timeline created. TimelineSetter will create a unique HTML page that embeds a JSON object with your data and package the stock CSS and JavaScript along with it to drop into pages. You can customize the CSS to match the look and feel of your site.

## Dependencies

TimelineSetter relies on ProPublica's Ruby gem TableFu, as well as the JavaScript libraries Underscore and jQuery, all of which are either installed alongside, or packaged with the source. It has been tested with jQuery 1.4.4 and Underscore 1.1.4. 

## Installation

Install TimelineSetter through Rubygems:

    gem install timeline_setter


## The \`timeline-setter\` command

After TimelineSetter is installed, you should have the `timeline-setter` command available. The command looks for a CSV file to parse and outputs static assets. At any point, find help by running `timeline-setter` without any arguments, or by adding the `-h` flag. Run the command like so:

    timeline-setter -c /path/to/data.csv -o /path/to/output/directory

Add the `-a` flag if you'd like TimelineSetter to add the default supporting assets to the output directory. And, for fun, add the `-O` flag to open a browser to your new timeline after it is generated. 

## Setting up your spreadsheet

TimelineSetter looks for certain column names in your spreadsheet in order to generate a timeline. Here's a summary of each column and its significance:

### event\_date

The date the event happened. Right now, TimelineSetter only supports single-date events, but this can be specific down to the second. The generator will try its best to parse out human dates. Try "March 20, 2010," "3/20/2010," "Mar. 20, 2010 11:59 PM" etc.

### event\_display\_date

The date *displayed* on the event's card in the timeline. If this is blank, it will fall back to `event_date`

### event\_description

A textual description of the event.

### event\_link

A URL to send users to more details about an event. This will generate a "read more" button at the bottom of the card pointing to the URL.

### event\_series

A string representing a series of events this particular event is a part of. TimelineSetter will find all the unique series among events in the spreadsheet and assign both colors and checkboxes for them at the top of the spreadsheet. Events not assigned a series will have their timeline notches colored charcoal, and will have no associated checkbox.

### event\_html

Any arbitrary HTML that will be inserted above the `event_description`. This field may contain nearly everything except `<script>` tags. If you choose to use JavaScript, for now you must do it within an iframe which can then be dropped into the `event_html` field. Try image tags, YouTube embeds, etc.

## Folder structure and deployment

After you've generated a timeline with the `timeline-setter` command, you should see a structure much like this where you've specified your output:

      |-output
      |---timeline.html
      |---javascripts
      |-----timeline-setter.js
      |-----vendor
      |-------underscore-min.js
      |---stylesheets
      |-----timeline-setter.css
      
      NB: jQuery is linked to Google's CDN in timeline.html

Dropping the whole folder onto your server or an asset host like S3 will allow the app to run self-contained. It requires no server-side processing at all. To drop into your CMS, simply copy the relevant bits of `timeline.html` and paste into your site's template. Then, adjust the `<link>` and `<script>` tags to point to their appropriate destinations.

## Styling your timeline

TimelineSetter timelines are fully styleable. The default ProPublica "theme" stylesheet is packaged alongside each generated asset bundle, and is available in `stylesheets/timeline-setter.css`. This is, of course, completely overrideable. Here's a guide to do that.

### Overview and styling the container and top matter

All TimelineSetter CSS is scoped within `TS`. The container is `#timeline_setter` and every selector has a `TS` prefix. Upon first glance, it may not seem like there is much markup at all. We make extensive use of JavaScript (ERB-style) templating via [Underscore.js](http://documentcloud.github.com/underscore/#template) and templates for each part of the timeline reside in the DOM. The controls (zoom in/out, previous/next buttons) are available within `#TS-top_matter_container .TS-controls`. 

Series checkboxes are injected into `.TS-series_nav_container` and templated via `script#TS-notch_tmpl`. Currently, series colors are hard coded in the JavaScript. We support a maximum of nine series colors (assigned in this order: #065718, #EDC047, #91ADD1, #929E5E, #9E5E23, #C44846, #065718, #EDD4A5, #CECECE, check `CardContainer.colors` in timeline-setter.js to override). Technically you can create an unlimited number of series, but they will eventually fall back to the default notch color.

### Styling the bar, notches and cards

The timeline bar is made up of non-clickable interval notches used to denote periodic intervals of time, and event notches, which, when clicked, reveal their associated cards. Interval notches are templated within `script#TS-year_notch_tmpl` and display formatted dates based on the interval of time between events as automatically determined by the JavaScript. Here's a sampling of what you might see in interval notches:

    year        => 2001
    month       => June, 2004
    day         => May 1, 2005
    hour/minute => 11:59
    second      => 11:59:22

Event notches are templated through `#TS-card-tmpl` and contain individual classes corresponding to spreadsheet columns. `.TS-item-label` corresponds to `event_description`, `.TS-item_html` corresponds to `event_html`, `.TS-read_btn` is linked to `event_link` and `.TS-item_year` corresponds to `event_display_date` falling through to `event_date`. Finally, `TS-permalink` is a fragment link which will show the active card on page load if used.

## Roadmap

For the initial open source release, we're providing TimelineSetter as purely a "bake-out" utility, for creating static files. We plan to expand to include [TableSetter](http://propublica.github.com/table-setter/)-like functionality to host timelines as Sinatra apps.

On the client side, there are a whole slough of features we plan to add such as:

* Smoother zooming
* Deactivating series checkboxes if none of its events are within the zoomed viewport
* Auto-zooming the timeline if embedded into smaller containers
* More iOS gestures such as "pinching"
* Zooming to fit a series when the series is activated
* Ranges of events (e.g. Elizabeth Taylor was married to Miichael Wilding between Feb. 21, 1952 and Jan. 26, 1957, as shown [here](http://www.nytimes.com/interactive/2011/03/23/movies/20110323-ELIZABETH-TAYLOR-TIMELINE.html))
* Embed code
* JavaScript tests

## Links

* In the Wild: [ProPublica: How One Blast Affected Five Soldiers](http://www.propublica.org/special/tbi-psycho-platoon-timeline)

## Credits

## Change Log

### 0.1

Initial release

## License 

<%= license %>