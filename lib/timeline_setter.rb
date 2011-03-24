
module TimelineSetter
  ROOT = File.expand_path "#{File.dirname __FILE__}/.."
end

require 'date'
require 'time'
require 'erb'
require 'table_fu'
require 'json'

require "#{TimelineSetter::ROOT}/lib/timeline_setter/version"
require "#{TimelineSetter::ROOT}/lib/timeline_setter/parser"
require "#{TimelineSetter::ROOT}/lib/timeline_setter/event"
require "#{TimelineSetter::ROOT}/lib/timeline_setter/timeline"

