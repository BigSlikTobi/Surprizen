require 'gemini-ai'

GEMINI_CLIENT = Gemini.new(
  credentials: {
    service: 'generative-language-api',
    api_key: Rails.application.credentials.gemini[:api_key]
  },
  options: {
    model: 'gemini-2.5-flash'
  }
) 