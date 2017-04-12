const {Request, Annotation} = require("zipkin");
const initalizeZipkin =  require("./src/initalizeZipkin");
const _ = require("lodash");
export default (zipkinUrl, _remoteServiceName, _serviceName) =>
  req => {
if (!zipkinUrl || zipkinUrl.length > 0 && zipkinUrl.trim() === "") {
      throw new Error("zipkin destination url should be valid");
    }
    let zipkinInstance = initalizeZipkin.default;
    var {tracer, serviceName = (_serviceName) ? _serviceName: "unknwown", remoteServiceName} = zipkinInstance(zipkinUrl, _remoteServiceName);
    var traceId = null;
    tracer.scoped(function () {
      tracer.setId(tracer.createChildId());
      traceId = tracer.id;
      const wrappedOptions = Request.addZipkinHeaders(req, traceId);
      let method = wrappedOptions.method || "GET";
      if (!_serviceName) {
        serviceName = req.url;
      }
      tracer.recordServiceName(serviceName);
      tracer.recordRpc(method.toUpperCase());
      tracer.recordBinary("http.url", wrappedOptions.uri || wrappedOptions.url);
      tracer.recordAnnotation(new Annotation.ClientSend());
      tracer.recordClientAddr("clientip");
      if (remoteServiceName) {
        tracer.recordAnnotation(new Annotation.ServerAddr({
          serviceName: remoteServiceName
        }));
      }
      _.assign(req.header, wrappedOptions.headers);
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
