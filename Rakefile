require 'rubygems'
require 'rake'
require 'rake/clean'
require 'rake/rdoctask'
require 'rspec/core/rake_task'
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

desc "generate gh-pages"
task :gh_pages do
  `rake docs`
  `rake yard`
  `rake docco`
  `rake sample`
  
  `git branch` =~ /^\* (.+)?\n/
  current_branch = $1
  
  `git commit -am "docs"`
  `git push github #{current_branch}`
  `git checkout gh-pages`
  `git merge #{current_branch}`
  `git push github gh-pages`
  `git checkout #{current_branch}`
end

desc "generate docco"
task :docco do
  `docco ./public/javascripts/*.js`
  `cp -R ./docs/* ./doc`
  `rm -R docs`
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
  end
  Jeweler::GemcutterTasks.new
rescue LoadError
  puts "Jeweler (or a dependency) not available. Install it with: gem install jeweler"
end

Rake::RDocTask.new do |rdoc|
  version = File.exist?('VERSION') ? File.read('VERSION') : ""
  rdoc.rdoc_dir = 'rdoc'
  rdoc.title = "TimelineSetter #{version}"
  rdoc.rdoc_files.include('README*')
  rdoc.rdoc_files.include('lib/**/*.rb')
end

# run tests with `rake spec`
RSpec::Core::RakeTask.new(:spec) do |spec|
  spec.pattern = 'spec/*_spec.rb'
  spec.rspec_opts = ['--color', '--format nested']
end

desc "generate yard docs"
task :yard do
  `yard -o ./documentation`
end

desc "generate sample timeline"
task :sample do
  `./bin/timeline-setter -c ./tbi.csv -m -o ./public/`
  `cp ./public/timeline.html ./doc/timeline-sample.html`
end



