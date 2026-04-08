async function test() {
  const originalJSON = JSON.stringify({ message: "Hello world", extra: "Some more data here to increase length" });
  const rawHeaders = new Headers({
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(originalJSON).toString()
  });

  const body = JSON.stringify({ _enc: { iv: "123", data: "...", tag: "..." } });
  
  try {
    const res = new Response(body, { headers: rawHeaders });
    console.log("Response created without error.");
    console.log("Headers in new response:", res.headers.get('content-length'));
    
    // Check if reading it crashes
    await res.text();
    console.log("Read okay");
  } catch (e) {
    console.error("Error creating response:", e);
  }
}
test();
