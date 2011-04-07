$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))

require 'rubygems'
require 'timeline_setter'
require 'timeline_setter/cli'
require 'rspec'

TEST_CSV_PATH = File.expand_path(File.dirname(__FILE__) + '/test_data.csv')
TEST_CSV      = File.open(TEST_CSV_PATH,'r').read
TS_BINARY     = File.expand_path('../../bin/timeline-setter',__FILE__)