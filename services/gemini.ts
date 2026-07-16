import { db, auth } from '../lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface CareerRecommendation {
  career: {
    title: string;
    salary: string;
    match: number;
    description: string;
    tags: string[];
    requiredSkills: Array<{
      name: string;
      importance: 'high' | 'medium' | 'low';
      description: string;
    }>;
    roadmap: Array<{
      step: number;
      title: string;
      description: string;
      estimatedTime: string;
      focusSkills: string[];
    }>;
  };
  courses: Array<{
    title: string;
    provider: string;
    duration: string;
    price: string;
    icon: string;
    color: string;
    url: string;
  }>;
}

export interface OnboardingState {
  educationLevel: string | null;
  academicBackground: string | null;
  age?: string | null;
  country?: string | null;
  interests: string[];
  skills: Record<string, string>;
  personality: Record<string, number>;
  careerGoal: string | null;
  timeCommitment: string | null;
  budget: string | null;
  aboutMe?: string;
  excitingWork?: string;
  dreamCareer?: string;
  freeTimeActivities?: string;
  additionalInsights?: string;
}

/**
 * Fetches up to 2 courses from the public Coursera Catalog API based on a search query.
 */
async function fetchCourseraCourses(query: string) {
  try {
    const url = `https://api.coursera.org/api/courses.v1?q=search&query=${encodeURIComponent(query)}&fields=name,shortName,description,photoUrl&limit=2`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Coursera API error status: ${res.status}`);
    
    const data = await res.json();
    const elements = data.elements || [];
    return elements.map((course: any) => ({
      title: course.name,
      provider: 'Coursera',
      duration: 'Self-paced',
      price: 'Free',
      icon: '🎓',
      color: '#3B82F6', // Brighter, more accessible blue for readability
      url: `https://www.coursera.org/learn/${course.shortName}`
    }));
  } catch (err) {
    console.warn('Coursera fetch failed:', err);
  }
  return [];
}

/**
 * Fetches up to 2 educational videos from the YouTube Data API v3.
 */
async function fetchYouTubeVideos(query: string, apiKey: string) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' course tutorial')}&type=video&maxResults=2&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API error status: ${res.status}`);

    const data = await res.json();
    const items = data.items || [];
    return items.map((item: any) => ({
      title: item.snippet.title,
      provider: `YouTube (${item.snippet.channelTitle})`,
      duration: 'Video Tutorial',
      price: 'Free',
      icon: '📺',
      color: '#FF0000',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (err) {
    console.warn('YouTube fetch failed:', err);
  }
  return [];
}

/**
 * Sends the user's onboarding questionnaire responses to Gemini 2.5 Flash
 * and requests a structured JSON career path recommendation.
 */
export async function getCareerRecommendation(state: OnboardingState): Promise<CareerRecommendation> {
  const startTime = Date.now();
  
  // Load dynamic API keys from Firestore system config
  let geminiKey = GEMINI_API_KEY;
  let youtubeKey = GEMINI_API_KEY; // YouTube uses the same fallback by default
  try {
    const configSnap = await getDoc(doc(db, 'configs', 'system'));
    if (configSnap.exists()) {
      const data = configSnap.data();
      if (data.geminiApiKey) {
        geminiKey = data.geminiApiKey;
      }
      if (data.youtubeApiKey) {
        youtubeKey = data.youtubeApiKey;
      }
    }
  } catch (keyErr) {
    console.warn('Failed to load dynamic API keys from Firestore, using default fallbacks:', keyErr);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

  const prompt = `
You are an expert AI Career Coach. Analyze this user's profile and recommend a matching career path.

User Profile:
- Education Level: ${state.educationLevel || 'Not specified'}
- Academic Background: ${state.academicBackground || 'Not specified'}
- Age: ${state.age || 'Not specified'}
- Country: ${state.country || 'Not specified'}
- Interests: ${state.interests.join(', ') || 'Not specified'}
- Transferable Skill Levels (rated Beginner/Intermediate/Advanced): ${JSON.stringify(state.skills)}
- Personality Traits (RIASEC items rated 1 to 5): ${JSON.stringify(state.personality)}
- Primary Career Goal Priority: ${state.careerGoal || 'Not specified'}
- Time Commitment Available: ${state.timeCommitment || 'Not specified'}
- Budget Preference: ${state.budget || 'Not specified'}

Personal Context & Open-Ended Insights:
- Tell us about yourself: ${state.aboutMe || 'Not provided'}
- What type of work excites you: ${state.excitingWork || 'Not provided'}
- Career you have always been interested in: ${state.dreamCareer || 'Not provided'}
- Free time activities: ${state.freeTimeActivities || 'Not provided'}
- Additional insights/preferences to know: ${state.additionalInsights || 'Not provided'}

Your response MUST follow the strict JSON schema provided. Recommend a career title, estimated salary range in Nigerian Naira (₦) (e.g. '₦6,000,000 - ₦12,000,000 per year' or '₦500k - ₦1.2m per month'), match percentage (an integer between 60 and 100), and a personalized description explaining why it fits.

Also provide:
1. requiredSkills: Exactly 3-5 core technical or soft skills required to succeed in this career, each with an importance score ('high', 'medium', or 'low') and a brief description.
2. roadmap: A structured learning roadmap consisting of exactly 3 sequential phases/steps to achieve this career, including estimated durations, step descriptions, and focus skills for each step.
3. searchQuery: A short search phrase (2-4 words) that we can use to query course APIs (e.g. "React development" or "Data Science Python").
4. udemyCourses: Exactly 2 highly relevant Udemy course recommendations (title, duration, price in Nigerian Naira e.g. '₦15,000' or 'Free') that are ideal for this career path.
5. fallbackCoursera: Exactly 2 fallback Coursera courses (title, duration, price in Nigerian Naira e.g. '₦20,000' or 'Free') in case the API call fails.
6. fallbackYouTube: Exactly 2 fallback YouTube video tutorials (title, channel) in case the API call fails.
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          career: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              salary: { type: 'STRING' },
              match: { type: 'INTEGER' },
              description: { type: 'STRING' },
              tags: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
              requiredSkills: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    importance: { type: 'STRING' },
                    description: { type: 'STRING' },
                  },
                  required: ['name', 'importance', 'description'],
                },
              },
              roadmap: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    step: { type: 'INTEGER' },
                    title: { type: 'STRING' },
                    description: { type: 'STRING' },
                    estimatedTime: { type: 'STRING' },
                    focusSkills: {
                      type: 'ARRAY',
                      items: { type: 'STRING' },
                    },
                  },
                  required: ['step', 'title', 'description', 'estimatedTime', 'focusSkills'],
                },
              },
            },
            required: ['title', 'salary', 'match', 'description', 'tags', 'requiredSkills', 'roadmap'],
          },
          searchQuery: { type: 'STRING' },
          udemyCourses: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                duration: { type: 'STRING' },
                price: { type: 'STRING' },
              },
              required: ['title', 'duration', 'price']
            }
          },
          fallbackCoursera: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                duration: { type: 'STRING' },
                price: { type: 'STRING' },
              },
              required: ['title', 'duration', 'price']
            }
          },
          fallbackYouTube: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                channel: { type: 'STRING' },
              },
              required: ['title', 'channel']
            }
          }
        },
        required: ['career', 'searchQuery', 'udemyCourses', 'fallbackCoursera', 'fallbackYouTube'],
      },
    },
  };

  try {
    let response: Response | null = null;
    let retries = 2;
    let delay = 1500;

    while (retries >= 0) {
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if ((response.status === 429 || response.status === 503) && retries > 0) {
        console.warn(`Gemini API busy (Status ${response.status}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 1.5;
        continue;
      }
      break;
    } catch (fetchErr) {
      if (retries > 0) {
        console.warn(`Gemini API connection failed. Retrying in ${delay}ms...`, fetchErr);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 1.5;
        continue;
      }
      throw fetchErr;
    }
  }

  if (!response || !response.ok) {
    const errorText = response ? await response.text() : 'No network connection';
    throw new Error(`Gemini API error (${response ? response.status : 'Unknown'}): ${errorText}`);
  }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Received empty text from Gemini API response');
    }

    const parsedResult = JSON.parse(textContent);
    
    // Now, run parallel live searches for Coursera and YouTube using the searchQuery!
    const searchPhrase = parsedResult.searchQuery || parsedResult.career.title;
    
    const [liveCoursera, liveYouTube] = await Promise.all([
      fetchCourseraCourses(searchPhrase),
      fetchYouTubeVideos(searchPhrase, youtubeKey)
    ]);

    const courses: any[] = [];
    
    // 1st Round of Interleaving:
    // Udemy 1
    if (parsedResult.udemyCourses?.[0]) {
      courses.push({
        title: parsedResult.udemyCourses[0].title,
        provider: 'Udemy',
        duration: parsedResult.udemyCourses[0].duration,
        price: parsedResult.udemyCourses[0].price,
        icon: 'code',
        color: '#A435F0',
        url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(searchPhrase)}`
      });
    }
    
    // Coursera 1
    const coursera1 = liveCoursera?.[0] || parsedResult.fallbackCoursera?.[0];
    if (coursera1) {
      courses.push({
        title: coursera1.title,
        provider: 'Coursera',
        duration: coursera1.duration || 'Self-paced',
        price: coursera1.price || 'Free',
        icon: 'book-open',
        color: '#3B82F6',
        url: coursera1.url || `https://www.coursera.org/search?query=${encodeURIComponent(searchPhrase)}`
      });
    }
    
    // YouTube 1
    const youtube1 = liveYouTube?.[0] || parsedResult.fallbackYouTube?.[0];
    if (youtube1) {
      courses.push({
        title: youtube1.title,
        provider: youtube1.provider || `YouTube (${youtube1.channel})`,
        duration: youtube1.duration || 'Video Tutorial',
        price: youtube1.price || 'Free',
        icon: 'play-circle',
        color: '#FF0000',
        url: youtube1.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(searchPhrase + ' tutorial')}`
      });
    }

    // 2nd Round of Interleaving:
    // Udemy 2
    if (parsedResult.udemyCourses?.[1]) {
      courses.push({
        title: parsedResult.udemyCourses[1].title,
        provider: 'Udemy',
        duration: parsedResult.udemyCourses[1].duration,
        price: parsedResult.udemyCourses[1].price,
        icon: 'code',
        color: '#A435F0',
        url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(searchPhrase)}`
      });
    }
    
    // Coursera 2
    const coursera2 = liveCoursera?.[1] || parsedResult.fallbackCoursera?.[1];
    if (coursera2) {
      courses.push({
        title: coursera2.title,
        provider: 'Coursera',
        duration: coursera2.duration || 'Self-paced',
        price: coursera2.price || 'Free',
        icon: 'book-open',
        color: '#3B82F6',
        url: coursera2.url || `https://www.coursera.org/search?query=${encodeURIComponent(searchPhrase)}`
      });
    }
    
    // YouTube 2
    const youtube2 = liveYouTube?.[1] || parsedResult.fallbackYouTube?.[1];
    if (youtube2) {
      courses.push({
        title: youtube2.title,
        provider: youtube2.provider || `YouTube (${youtube2.channel})`,
        duration: youtube2.duration || 'Video Tutorial',
        price: youtube2.price || 'Free',
        icon: 'play-circle',
        color: '#FF0000',
        url: youtube2.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(searchPhrase + ' tutorial')}`
      });
    }

    const elapsed = Date.now() - startTime;
    const currentUser = auth.currentUser;
    addDoc(collection(db, 'api_logs'), {
      userId: currentUser?.uid || 'Anonymous',
      userEmail: currentUser?.email || 'Anonymous',
      timestamp: new Date().toISOString(),
      latency: elapsed,
      success: true,
      model: 'gemini-2.5-flash'
    }).catch(logErr => console.warn('Failed to save API performance log:', logErr));

    return {
      career: parsedResult.career,
      courses
    };
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    const currentUser = auth.currentUser;
    addDoc(collection(db, 'api_logs'), {
      userId: currentUser?.uid || 'Anonymous',
      userEmail: currentUser?.email || 'Anonymous',
      timestamp: new Date().toISOString(),
      latency: elapsed,
      success: false,
      model: 'gemini-2.5-flash',
      error: error?.message || String(error)
    }).catch(logErr => console.warn('Failed to save API performance error log:', logErr));

    console.error('Failed to fetch career recommendation from Gemini:', error);
    throw error;
  }
}
