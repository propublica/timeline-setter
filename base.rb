require 'date'
require 'time'
require 'erb'
require 'rubygems'
require 'table_fu'

module TimelineSetter
  class Parser
    attr_reader :events
    
    # sheet should contain columns for
    #  * event_date
    #  * event_display_date
    #  * event_description
    #  * event_link
    #  * event_thumbnail
    def initialize sheet
      @events = []
      spreadsheet = TableFu.new(sheet) do |s|
        s.columns = %w[event_date event_display_date event_description event_link event_thumbnail]
      end
      
      spreadsheet.rows.each do |row|
        hash = spreadsheet.columns.inject({}) {|memo, column| memo[column.to_sym] = row[column].to_s ; memo}
        e = Event.new(hash)
        @events << e.template
      end
    end
    
  end
  
  class Event
    def initialize(evt = {})
      @evt = evt
    end
    
    def template
      template = <<-HTML
          <div id="item_<%= Time.parse(@evt[:event_date]).to_i %>" class="item" data-item-timestamp="<%= Time.parse(@evt[:event_date]).to_i %>">
            <div class="item_label">
              <%= @evt[:event_description]%>
            </div>
              <% if @evt[:event_link] %>
                <div class="doc_img">
                  <a target="_blank" href="<%= @evt[:event_link] %>"><img src="<%= @evt[:event_thumbnail] %>"></a>
                  <div class="read_btn"><a target="_blank" href="<%= @evt[:event_link] %>">Read More</a></div>
                </div>
              <% end %>

            <div class="item_year">
              <%= @evt[:event_display_date].empty? ? @evt[:event_date] : @evt[:event_display_date] %>
            </div>
              <div class="css_arrow css_arrow_down"></div>
          </div>
      HTML
      ERB.new(template).result(binding)
    end
  end
  
  class Timeline
    attr_reader :timeline
    
    def initialize(events)
      timeline = <<-HTML
        <link href="timeline-setter.css" rel="stylesheet" />
        <script src="http://www.propublica.org/js/public/assets/all.js?1296850807"></script>
        
        <div id="timeline">
          <div class="timeline_inner timeline_upper">
          <% events.each do |event| %>
            <%= event %>
          <% end %>
          </div>
        </div>
        <script src="timeline-setter.js"></script>
        
      HTML
      @timeline = ERB.new(timeline).result(binding)
    end
  end

end