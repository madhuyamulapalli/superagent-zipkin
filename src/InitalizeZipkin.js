import {Tracer, ExplicitContext} from "zipkin";
import record from "./recorder";
let zipkinInstance = null;
class InitalizeZipkin {
  constructor(zipkinUrl) {
    if (!zipkinInstance) {
      const ctxImpl = new ExplicitContext();
      const recorder = record(zipkinUrl);
      const tracer = new Tracer({ctxImpl, recorder}); // configure your tracer properly here

      const nameOfRemoteService = "SPYDRUI";
      zipkinInstance = {tracer, remoteServiceName: nameOfRemoteService};
    }
    return zipkinInstance;
  }
}