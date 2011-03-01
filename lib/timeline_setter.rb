require 'date'
require 'time'
require 'erb'
require 'rubygems'
require 'table_fu'
require 'json'

module TimelineSetter
  class Parser
    attr_reader :events
    
    # sheet should contain columns for
    #  * event_date
    #  * event_display_date
    #  * event_description
    #  * event_link
    #  * event_thumbnail
    #  * event_series
    #  * event_media_type
    #  * event_html
    def initialize sheet
      @events = []
      spreadsheet = TableFu.new(sheet) do |s|
        s.columns = %w[event_date event_display_date event_description event_link event_series event_html]
      end
      
      spreadsheet.rows.each do |row|
        hash = spreadsheet.columns.inject({}) {|memo, column| memo[column.to_sym] = row[column].to_s ; memo}
        @events << hash
      end
    end
  end
  
  class Event
    attr_reader :data
    def initialize(evt = {})
      @data = evt
    end
        
    def to_html
      ERB.new(File.open(File.expand_path("../../templates/event.erb", __FILE__)).read).result(binding)
    end
  end
  
  class Timeline
    attr_reader :timeline
    def initialize(events)
      @events = events
    end
    
    def to_html
      @events.inject([]) {|memo, evt| memo << Event.new(evt).to_html ; memo }
    end
    
    def to_json
      @events.collect {|r| r[:timestamp] = Time.parse(r[:event_date]).to_i }
      @events.to_json
    end
        
    def timeline
      @html = self.to_html
      @timeline = ERB.new(File.open(File.expand_path("../../templates/timeline.erb", __FILE__)).read).result(binding)
    end
  end

end