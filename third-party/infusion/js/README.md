This is a custom build of [Infusion](http://github.com/fluid-project/infusion) containing the whole core framework, but excluding jQuery. It was build using the following command:

ant -lib lib/rhino customBuild -Dinclude="framework" -Dexclude="jQuery" -Djsfilename="infusion-framework.js" -DnoMinify="true"