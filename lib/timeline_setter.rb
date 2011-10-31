
module TimelineSetter
  ROOT = File.expand_path "#{File.dirname __FILE__}/.."
end

require 'date'
require 'time'
require 'erb'
require 'table_fu'
require 'json'
require 'kompress'

require "#{TimelineSetter::ROOT}/lib/timeline_setter/version"
require "#{TimelineSetter::ROOT}/lib/timeline_setter/parser"
require "#{TimelineSetter::ROOT}/lib/timeline_setter/timeline"
