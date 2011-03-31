module TimelineSetter
  module Util

    # Utility method to lightly minify CSS -- just remove \s+ where we can.
    def minify_css(css)
      # take out new lines
      css.gsub!(/\n/,'')

      # take out spaces between selectors and rule blocks
      css.gsub!(/([\.a-zA-Z_\-\#]+?)\s*\{\s*([^\{\}\s])?/,'\1{\2')

      # take out spaces between rule block endings and selectors
      css.gsub!(/\}\s*([\.a-zA-Z_\-\#]+?)/,'}\1')

      # take out spaces between rules
      css.gsub!(/(:|;)(\s+)?([\.a-zA-Z_0-9]+)?/,'\1\3')

      # take out comments
      css.gsub!(/(\/\*.*?\*\/)/,' ')

      css
    end

    def minify_html(html)
      html.gsub(/(?:^|\s+?)(<.*?>)/, '\1')
    end
    
  end
end
