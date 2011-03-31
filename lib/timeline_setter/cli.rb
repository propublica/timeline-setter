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
        opts.on('-a', '--with-assets', 'Output timeline supporting assets as well') do |a|
          @options[:assets] = a
        end
        opts.on('-O', '--open', 'Open generated timeline in a browser') do |o|
          @options[:open] = o
        end
        opts.on('-m', '--min', 'Create a minified one-page version of the timeline') do |m|
          @options[:min] = m
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
      TimelineSetter::Timeline.new(events.events).send(@options[:min] ? :timeline_min : :timeline)
    end

    def outdir
      @options[:output] ? @options[:output] : "#{`pwd`.strip}/"
    end

    def compile!
      if @options[:assets]
        FileUtils.cp_r(Dir.glob("#{TimelineSetter::ROOT}/public/*"), outdir)
      end

      File.open(outdir + 'timeline.html', 'w+') do |doc|
        doc.write html
      end

      puts "== Files copied to #{outdir}"

      if @options[:open]
        puts "== Opening ..."
        %x{ open #{outdir}timeline.html }
      end
    end

  end
end
