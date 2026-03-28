import axios from "axios"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("refresh_token")
        if (refreshToken && !error.config._retry) {
          error.config._retry = true
          try {
            const res = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/refresh`,
              null,
              { params: { refresh_token: refreshToken } }
            )
            const { access_token, refresh_token } = res.data
            localStorage.setItem("access_token", access_token)
            localStorage.setItem("refresh_token", refresh_token)
            error.config.headers.Authorization = `Bearer ${access_token}`
            return apiClient(error.config)
          } catch {
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            window.location.href = "/login"
          }
        } else {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
