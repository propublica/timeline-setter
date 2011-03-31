module TimelineSetter
  class Parser
    attr_reader :events

    # Initialize a new timeline from a CSV file via TableFu,
    # add a hash for each row (event) in the sheet to an events array.
    # Sheet should contain columns for
    #  * date
    #  * display_date
    #  * description
    #  * link
    #  * thumbnail
    #  * series
    #  * html
    #
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
