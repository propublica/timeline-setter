require 'rubygems'
require 'rake'
require 'rake/clean'

desc "build docs"
task :docs do 
  require 'rdiscount'
  require 'erb'
  license = File.open('LICENSE.txt','r').read
  mdown   = RDiscount.new(ERB.new(File.open('doc/doc.markdown','r').read).result(binding), :smart).to_html
  wrapper = File.open('doc/doc_wrapper.erb','r').read
  mdown   = File.open('index.html','w+') do |f|
    f.write ERB.new(wrapper).result(binding)
  end
end