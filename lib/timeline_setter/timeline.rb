module TimelineSetter
  class Timeline
    include Util
    attr_reader :timeline
    
    # Instantiate a new timeline from an events
    # array created in Parser#initialize
    def initialize(events)
      @events = events
    end
    
    # Convert human dates to timestamps, sort the hash by timestamp, and
    # convert the events hash to JSON to stick into our HTML.
    def to_json
      @events.collect {|r| r[:timestamp] = Time.parse(r[:date]).to_i }.sort{|a,b| b[:timestamp] <=> a[:timestamp]}
      @events.to_json
    end
    
    # Create timeline HTML by interpolating events hash into an ERB template.
    # Re-template timeline by editing ../templates/timeline.erb
    # This version preserves external links to CSS and JS. 
    def timeline
      @timeline = ERB.new(File.open("#{TimelineSetter::ROOT}/templates/timeline.erb").read).result(binding)
    end
    
    # Create a minified one-page version of a timeline by minifying CSS and JS and embedding all assets
    # into our ERB template.
    def timeline_min
      js = ""
      css = minify_css(File.open("#{TimelineSetter::ROOT}/public/stylesheets/timeline-setter.css").read)
      libs = Dir.glob("#{TimelineSetter::ROOT}/public/javascripts/vendor/**")
      libs.each { |lib| js << File.open(lib,'r').read }
      js << Closure::Compiler.new.compile(File.open("#{TimelineSetter::ROOT}/public/javascripts/timeline-setter.js", 'r'))
      @timeline = ERB.new(File.open("#{TimelineSetter::ROOT}/templates/timeline-min.erb").read).result(binding)
    end
    
  end  
end