(async () => {
  const info = await fetch("https://replicate.npmjs.com/", {
    headers: { 'npm-replication-opt-in': 'true' }
  }).then(res => res.json())

  let since = info.update_seq.toString()
  console.log("since", since)
  const limit = (100).toString()

  while (true) {
    const changes = await fetch(`https://replicate.npmjs.com/_changes?since=${since}&limit=${limit}`, {
      headers: { 'npm-replication-opt-in': 'true' }
    }).then(res => res.json())

    for (const change of changes.results) {
      if (change.deleted) continue

      const name = change.id
      if (name) {
        console.log(name)
        const cacheBuster = Math.floor(Math.random() * 1000000)
        fetch('https://packages.ecosyste.ms/api/v1/registries/npmjs.org/packages/' + name + '/ping?cb=' + cacheBuster, {
          headers: {
            'User-Agent': 'npm.ecosyste.ms',
            'X-API-Key': process.env.ECOSYSTEMS_API_KEY
          }
        })
          .then(res => console.log(`statusCode: ${res.status}`))
      }
    }

    if (changes.results.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // wait 5 seconds
    }

    since = changes.last_seq.toString()
  }
})()
