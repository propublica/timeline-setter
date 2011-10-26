require 'optparse'
require 'fileutils'

module TimelineSetter
  class CLI
    def initialize
      parse_options!
    end

    def parse_options!
      @options = {}
      option_parser = OptionParser.new do |opts|
        opts.banner = <<-BANNER
          TimelineSetter: A tool to generate HTML timelines from CSVs.

          Usage:
        BANNER

        opts.on('-c', '--csv CSV', 'CSV input file') do |c|
          @options[:csv] = c
        end
        opts.on('-o', '--output OUTPUT', 'Output directory to install timeline into.') do |o|
          @options[:output] = o
        end
        opts.on('-a', '--without-assets', 'Output timeline without supporting assets') do |a|
          @options[:no_assets] = a
        end
        opts.on('-O', '--open', 'Open generated timeline in a browser') do |o|
          @options[:open] = o
        end
        opts.on('-m', '--min', 'Create a minified one-page version of the timeline') do |m|
          @options[:min] = m
        end
        opts.on('-i', '--interval INTERVAL', 'Override automatic interval notches with a custom interval.') do |i|
          @options[:interval] = i
        end


        opts.on_tail("-h", "--help", "Show this message") do
          puts opts
          exit
        end
      end
      option_parser.parse!

      if @options.empty?
        puts option_parser.on_tail
        exit
      else
        compile!
      end
    end

    def sheet
      File.open(@options[:csv]).read
    end

    def events
      TimelineSetter::Parser.new sheet
    end

    def html
      TimelineSetter::Timeline.new({
        :events => events.events,
        :interval => @options[:interval] || ''
      }).send(@options[:min] ? :timeline_min : :timeline)
    end

    def outdir
      @options[:output] ? @options[:output] : "#{`pwd`.strip}/"
    end
    
    def timeline_page_path
      File.join(outdir, 'timeline.html')
    end

    def compile!
      if !@options[:no_assets] || !@options[:min]
        FileUtils.cp_r(Dir.glob("#{TimelineSetter::ROOT}/public/*"), outdir)
        `mv #{outdir}/assets/* #{outdir}/javascripts/ && rm -rf #{outdir}/assets`
      end

      File.open(timeline_page_path, 'w+') do |doc|
        doc.write html
      end

      puts "== Files copied to #{outdir}"

      if @options[:open]
        puts "== Opening ..."
        %x[ open #{timeline_page_path} ]
      end
    end

  end
end
