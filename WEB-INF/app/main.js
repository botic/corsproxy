var {ByteArray} = require("binary");
var strings = require("ringo/utils/strings");
var response = require("ringo/jsgi/response");

var URLFetchServiceFactory = Packages.com.google.appengine.api.urlfetch.URLFetchServiceFactory;
var HTTPRequest = com.google.appengine.api.urlfetch.HTTPRequest;
var HTTPHeader = com.google.appengine.api.urlfetch.HTTPHeader;

const FETCH_OPTIONS = com.google.appengine.api.urlfetch.FetchOptions.Builder.doNotFollowRedirects();
const HTTP_GET = com.google.appengine.api.urlfetch.HTTPMethod.GET;

// Minimalistic request dispatcher in lieu of a proper framework
exports.app = function(request) {
   var path = request.pathInfo.slice(1) || "index";

   if (path === "index") {
      var query = request.queryString || "";

      if (!strings.isUrl(query)) {
         return response.error().text("Query is not an URL!");
      }

      var fetchService = URLFetchServiceFactory.getURLFetchService();
      var fetchRequest = new HTTPRequest(new java.net.URL(query), HTTP_GET, FETCH_OPTIONS);
      fetchRequest.addHeader(new HTTPHeader("Cache-Control", "max-age=0, must-revalidate"));
      var httpResponse = fetchService.fetch(fetchRequest);

      if (httpResponse.getResponseCode() !== 200) {
         return response.error().text("Got response " + httpResponse.getResponseCode());
      }

      var bytes = new ByteArray(httpResponse.getContent());
      if (bytes.length === 0) {
         return response.error().text("Emtpy response.");
      }

      try {
         var obj = JSON.parse(bytes.decodeToString("UTF-8").trim());
         return response.addHeaders({
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=180"
         }).json(obj);
      } catch (e) {
         return response.error().text("Invalid JSON.");
      }
   }

   return response.notFound(request.pathInfo);
}

// main script to start application for testing
if (require.main == module) {
   require("ringo/httpserver").main(module.id);
}
