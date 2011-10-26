module TimelineSetter
  class Timeline
    attr_reader :timeline
    # Instantiate a new timeline from an events
    # array created in Parser#initialize
    def initialize(opts = {})
      @events   = opts[:events]
      @interval = opts[:interval] || ''
    end

    # Convert human dates to timestamps, sort the hash by timestamp, and
    # convert the events hash to JSON to stick into our HTML.
    def to_json
      @events.each {|r| r[:timestamp] = Time.parse(r[:date]).to_i * 1000 }
      @events.to_json
    end
    
    def config_json
      {
        "interval"  => "#{@interval}",
        "container" => "#timeline"
      }.to_json
    end

    def timeline_markup
      tmpl("timeline-markup.erb")
    end

    # Create timeline HTML by interpolating events hash into an ERB template.
    # Re-template timeline by editing ../templates/timeline.erb
    # This version preserves external links to CSS and JS.
    def timeline
      @timeline = tmpl("timeline.erb")
    end

    # Create a minified one-page version of a timeline by minifying CSS and JS and embedding all assets
    # into our ERB template.
    def timeline_min
      @js = ""
      @css = Kompress::CSS.new(File.open("#{TimelineSetter::ROOT}/public/stylesheets/timeline-setter.css").read).css
      libs = Dir.glob("#{TimelineSetter::ROOT}/public/javascripts/vendor/**")
      libs.each { |lib| @js << File.open(lib,'r').read }
      @min_html = Kompress::HTML.new(timeline_markup).html
      @js << Closure::Compiler.new.compile(File.open("#{TimelineSetter::ROOT}/public/javascripts/timeline-setter.js", 'r'))
      @timeline = tmpl("timeline-min.erb")
    end
    
    def tmpl(tmpl_file)
      ERB.new(File.open("#{TimelineSetter::ROOT}/templates/#{tmpl_file}").read).result(binding)
    end
  end
end
