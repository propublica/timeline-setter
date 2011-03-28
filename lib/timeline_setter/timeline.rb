module TimelineSetter
  class Timeline
    attr_reader :timeline
    def initialize(events)
      @events = events
    end
    
    def to_json
      @events.collect {|r| r[:timestamp] = Time.parse(r[:event_date]).to_i }.sort{|a,b| b[:timestamp] <=> a[:timestamp]}
      @events.to_json
    end
    
    def self.minify_css(css)
      # take out new lines
      css.gsub!(/\n/,'')

      # take out spaces between selectors and rule blocks
      css.gsub!(/([\.a-zA-Z_\-\#]+?)\s*\{\s*([^\{\}\s])?/,'\1{\2')

      # take out spaces between rule block endings and selectors
      css.gsub!(/\}\s*([\.a-zA-Z_\-\#]+?)/,'}\1')

      # #take out spaces between rules
      css.gsub!(/(:|;)(\s+)?([\.a-zA-Z_0-9]+)?/,'\1\3')

      css
    end
    
    def timeline_min
      js = ""
      css = Timeline.minify_css(File.open("#{TimelineSetter::ROOT}/public/stylesheets/timeline-setter.css").read)
      libs = Dir.glob("#{TimelineSetter::ROOT}/public/javascripts/vendor/**")
      libs.each do |lib| ; js << File.open(lib,'r').read ; end
      js  << Closure::Compiler.new.compile(File.open("#{TimelineSetter::ROOT}/public/javascripts/timeline-setter.js", 'r'))
      @timeline = ERB.new(File.open("#{TimelineSetter::ROOT}/templates/timeline-min.erb").read).result(binding)
    end
      
    def timeline
      @timeline = ERB.new(File.open("#{TimelineSetter::ROOT}/templates/timeline.erb").read).result(binding)
    end
  end  
end