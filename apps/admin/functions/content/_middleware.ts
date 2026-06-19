interface Env {
  CONTENT_API: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  return context.env.CONTENT_API.fetch(context.request);
};
