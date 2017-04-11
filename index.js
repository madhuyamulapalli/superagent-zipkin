const zipkin = require("zipkin");
const Annotation = zipkin.Annotation;
const zipkinRequest = zipkin.Request;
const initalizeZipkin =  require("./src/initalizeZipkin");
export default (zipkinUrl, _remoteServiceName, _serviceName) =>
  req => {
if (!zipkinUrl || zipkinUrl.length > 0 && zipkinUrl.trim() === "") {
      throw new Error("zipkin destination url should be valid");
    }
    let zipkinInstance = initalizeZipkin.default;
    var {tracer, serviceName = (_serviceName) ? _serviceName: "unknwown", remoteServiceName} = zipkinInstance(zipkinUrl, _remoteServiceName);
    var traceId = null;
    req.on("request", (options) => {
      tracer.scoped(function () {
        tracer.setId(tracer.createChildId());
        traceId = tracer.id;
        const wrappedOptions = Request.addZipkinHeaders(options, traceId);
        let method = wrappedOptions.method || "GET";
        if (!_serviceName) {
          serviceName = req.url;
        }
        tracer.recordServiceName(serviceName);
        tracer.recordRpc(method.toUpperCase());
        tracer.recordBinary("http.url", wrappedOptions.uri || wrappedOptions.url);
        tracer.recordAnnotation(new Annotation.ClientSend());
        if (remoteServiceName) {
          // TODO: can we get the host and port of the http connection?
          tracer.recordAnnotation(new Annotation.ServerAddr({
            serviceName: remoteServiceName
          }));
        }
      });
    });
    req.on("end", () => {
      tracer.scoped(() => {
        tracer.setId(traceId);
        tracer.recordBinary("http.status_code", req.xhr.status.toString());
        tracer.recordAnnotation(new Annotation.ClientRecv());
      });
    });
    req.on("error", (err) => {
      tracer.scoped(() => {
        tracer.setId(traceId);
        tracer.recordBinary("request.error", err);
        tracer.recordAnnotation(new Annotation.ClientRecv());
      });
    });
  };
