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
    def initialize(sheet)
      @events = []
      spreadsheet = TableFu.new(sheet) do |s|
        s.columns = %w[date display_date description link series html]
      end
    
      spreadsheet.rows.each do |row|
        hash = spreadsheet.columns.inject({}) {|memo, column| memo[column.to_sym] = row[column].to_s ; memo}
        @events << hash
      end
    end
  end  
end