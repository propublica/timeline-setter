module TimelineSetter
  class Event
    attr_reader :data
    def initialize(evt = {})
      @data = evt
    end
      
    def to_html
      ERB.new(File.open("#{TimelineSetter::ROOT}/templates/event.erb").read).result(binding)
    end
  end
end