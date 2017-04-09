const zipkin = require("zipkin");
const Annotation = zipkin.Annotation;
const zipkinRequest = zipkin.Request;
const InitalizeZipkin = require("../InitalizeZipkin");
export default (zipkinUrl) =>
  req => {
    const zipkinInstance = new InitalizeZipkin(zipkinUrl);
    var {tracer, serviceName = "unknown", remoteServiceName} = zipkinInstance.default;
    var traceId = null;
    req.on("request", () => {
      traceId = tracer.id;
      tracer.scoped(function () {
        tracer.setId(tracer.createChildId());
        traceId = tracer.id;
        serviceName = req.url;
        let method = req.method || "GET";
        tracer.recordServiceName(serviceName);
        tracer.recordRpc(method.toUpperCase());
        tracer.recordBinary("http.url", req.url);
        tracer.recordAnnotation(new Annotation.ClientSend());
        if (remoteServiceName) {
          // TODO: can we get the host and port of the http connection?
          tracer.recordAnnotation(new Annotation.ServerAddr({
            serviceName: remoteServiceName
          }));
        }
        zipkinRequest.addZipkinHeaders({}, traceId);
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
