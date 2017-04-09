import {BatchRecorder} from "zipkin";
import {HttpLogger} from "zipkin-transport-http";
export default (zipkinUrl) => {
  let zipkinBaseUrl = zipkinUrl;
  if (zipkinBaseUrl === null || zipkinBaseUrl === undefined) {
    zipkinBaseUrl = "http://localhost:9411";
  }
  return new BatchRecorder({
    logger: new HttpLogger({
      endpoint: `${zipkinBaseUrl}/api/v1/spans`
    })
  });
};