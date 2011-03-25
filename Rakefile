require 'rubygems'
require 'rake'
require 'rake/clean'
require './lib/timeline_setter'


desc "build docs"
task :docs do 
  require 'rdiscount'
  require 'erb'
  version = TimelineSetter::VERSION
  license = File.open('LICENSE.txt','r').read
  mdown   = RDiscount.new(ERB.new(File.open('doc/doc.markdown','r').read).result(binding), :smart).to_html
  wrapper = File.open('doc/doc_wrapper.erb','r').read
  mdown   = File.open('index.html','w+') do |f|
    f.write ERB.new(wrapper).result(binding)
  end
end

desc "minify js"
task :minify_js do
  js = ""
  libs = Dir.glob("#{TimelineSetter::ROOT}/public/javascripts/vendor/**")
  libs.each do |lib| ; js << File.open(lib,'r').read ; end
  ts_js = Closure::Compiler.new.compile(File.open("#{TimelineSetter::ROOT}/public/javascripts/timeline-setter.js", 'r'))
  js << ts_js
  File.open("#{TimelineSetter::ROOT}/public/javascripts/ts-all-min.js", 'w+') do |f|
    f.write js
  end
end

begin
  require 'jeweler'
  
  Jeweler::Tasks.new do |gem|
    gem.name          = "timeline_setter"
    gem.summary       = %Q{TimelineSetter is a tool to create HTML timelines from spreadsheets of events.}
    gem.description   = %Q{TimelineSetter is a tool to create HTML timelines from spreadsheets of events.}
    gem.email         = "almshaw@gmail.com"
    gem.homepage      = "http://github.com/propublica/timeline-setter"
    gem.authors       = ["Al Shaw", "Jeff Larson"]
    gem.executables   = "timeline-setter"
    gem.require_paths = ['lib']
    gem.add_dependency "json"
    gem.add_dependency "table_fu"
    gem.add_dependency "closure-compiler"
    gem.add_development_dependency "rspec", ">= 2.0.0"
    gem.version = TimelineSetter::VERSION
    # gem is a Gem::Specification... see http://www.rubygems.org/read/chapter/20 for additional settings
  end
  Jeweler::GemcutterTasks.new
rescue LoadError
  puts "Jeweler (or a dependency) not available. Install it with: gem install jeweler"
end

