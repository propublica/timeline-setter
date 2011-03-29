$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))

require 'rubygems'
require 'timeline_setter'
require 'rspec'

TEST_CSV = <<-CSV
date,display_date,description,link,,series,event_html
"Feb. 18, 2003",,"Brock Savelkoul joins the Army and is stationed at Fort Riley, Kan., in the artillery division.  His assigned position is artillery survey, meaning he prepares terrain for mounting artillery canon.",,,Brock Savelkoul,"<h2 class=""timeline-img-hed"">Savelkoul Joins the Army</h2><img src=""http://maps.google.com/maps/api/staticmap?size=300x200&markers=color:blue|Fort%20Riley,KS&sensor=false&zoom=6"" width=""300"" height=""200"">"
"Aug. 10, 2003",,"Savelkoul deploys to Iraq, where he is based at Camp Forehead, near the Mansour District of Baghdad. ",,,Brock Savelkoul,
"Dec. 1, 2003",December 2003,Savelkoul and his unit are ambushed in the Mansour district. Many of them are shaken by the experience.,,,Brock Savelkoul,
CSV

RSpec.configure do |config| 
end