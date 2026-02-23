// supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL     = "https://tevdhsugikscvgvesvhr.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldmRoc3VnaWtzY3ZndmVzdmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcwMzcsImV4cCI6MjA4NzI3MzAzN30.Puc5_sqUxAqtojMc3nF8uJqjellJKPbPaLlROFaQQoc"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 既存コード（window.supabase参照している箇所）との後方互換を保つ
window.supabase = supabase