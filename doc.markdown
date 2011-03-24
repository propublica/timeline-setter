# TimelineSetter

TimelineSetter is a command-line utility to create beautiful standards-compliant timelines from spreadsheets. It supports any range of time, from minutes to years, custom descriptions and arbitrary HTML in event cards. It creates fluid embeds that will look great in any sized container.

The project is broken into two parts: a Ruby backend (along with a binary) for generating the assets, and the Timeline HTML, CSS and JavaScript itself which are nearly identical for every timeline created. TimelineSetter will create a unique HTML page that embeds a JSON object with your data and package the stock CSS and JavaScript along with it to drop into pages. You can customize the CSS to match the look and feel of your site.

## Dependencies

TimelineSetter relies on ProPublica's Ruby gem TableFu, as well as the JavaScript libraries Underscore and jQuery, all of which are either installed alongside, or packaged with the source. It has been tested with jQuery 1.4.4 and Underscore 1.1.4. 

## Installation

Install TimelineSetter through Rubygems:

    gem install timeline_setter


## The `timeline-setter` command

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

## Folder structure and Deployment

After you've generated a timeline with the `timeline-setter` command, you should see a structure much like this where you've specified your output:

      |-output
      |---timeline.html
      |---javascripts
      |-----timeline-setter.js
      |-----vendor
      |-------backbone-min.js
      |---stylesheets
      |-----timeline-setter.css

      NB: jQuery is linked to Google's CDN in timeline.html
      
Dropping the whole folder onto your server or an asset host like S3 will allow the app to run self-contained. It requires no server-side processing at all. To drop into your CMS, simply copy the relevant bits of `timeline.html` and paste into your site's template. Then, adjust the `<link>` and `<script>` tags to point to their appropriate destinations.

## Styling your timeline

## Roadmap

## Links

* In the Wild: [ProPublica: How One Blast Affected Five Soldiers](http://www.propublica.org/special/tbi-psycho-platoon-timeline)

## Credits

## Change Log

### 0.1

Initial release

## License 

Copyright (c) 2011 ProPublica

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.