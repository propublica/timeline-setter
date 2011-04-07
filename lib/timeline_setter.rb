
module TimelineSetter
  ROOT = File.expand_path "#{File.dirname __FILE__}/.."
end

require 'date'
require 'time'
require 'erb'
require 'table_fu'
require 'json'
require 'kompress'

begin
  require 'closure-compiler'
  rescue LoadError
    puts "== Warning, the closure-compiler gem is required to generate minified timelines"
end


require "#{TimelineSetter::ROOT}/lib/timeline_setter/version"
require "#{TimelineSetter::ROOT}/lib/timeline_setter/parser"
require "#{TimelineSetter::ROOT}/lib/timeline_setter/timeline"
