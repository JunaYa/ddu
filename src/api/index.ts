export async function getChatCompletion(imageUrl: string) {
  return fetch('https://api.red-pill.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer sk-vzMB14YeVyRvIOVl1Gki2LVfYzJI6y1U6D0lPyJkdOQlDVNW`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: 'What is the meaning of life?',
        },
        {
          type: 'image_url',
          image_url: {
            url: `${imageUrl}`,
          },
        },
      ],
    }),
  })
}
