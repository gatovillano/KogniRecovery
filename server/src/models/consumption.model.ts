import { query } from '../config/database.js';

export interface ConsumptionEvent {
  id: string;
  user_id: string;
  substance_name: string;
  quantity: number;
  unit: string;
  consumed_at: Date;
  craving_intensity?: number;
  context_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export const createConsumptionEvent = async (userId: string, data: Partial<ConsumptionEvent>): Promise<ConsumptionEvent> => {
  const sql = `
    INSERT INTO consumption_events (
      user_id, substance_name, quantity, unit, consumed_at, craving_intensity, context_notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [
    userId,
    data.substance_name || 'Desconocida',
    data.quantity || 1,
    data.unit || 'unidades',
    data.consumed_at || new Date(),
    data.craving_intensity || null,
    data.context_notes || null
  ];
  const result = await query(sql, values);
  return result.rows[0] as ConsumptionEvent;
};

export const getConsumptionEvents = async (userId: string, limit = 50, offset = 0): Promise<ConsumptionEvent[]> => {
  const sql = `
    SELECT * FROM consumption_events
    WHERE user_id = $1
    ORDER BY consumed_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await query(sql, [userId, limit, offset]);
  return result.rows as ConsumptionEvent[];
};

export const getWeeklyVariationStats = async (userId: string, days = 7): Promise<any[]> => {
  const sql = `
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - ($2 - 1) * INTERVAL '1 day',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::DATE as day_date
    )
    SELECT 
      ds.day_date as date,
      COALESCE(COUNT(ce.id), 0) > 0 as has_consumed,
      COALESCE(COUNT(ce.id), 0) as total_events
    FROM date_series ds
    LEFT JOIN consumption_events ce
      ON DATE(ce.consumed_at) = ds.day_date AND ce.user_id = $1
    GROUP BY ds.day_date
    ORDER BY ds.day_date ASC
  `;
  const result = await query(sql, [userId, days]);
  return result.rows;
};

export const getDailyQuantityVariationStats = async (userId: string, dateStr: string): Promise<any[]> => {
  const sql = `
    WITH hour_series AS (
      SELECT generate_series(0, 23) as hour_num
    )
    SELECT 
      hs.hour_num as hour,
      COALESCE(SUM(ce.quantity), 0) as total_quantity
    FROM hour_series hs
    LEFT JOIN consumption_events ce
      ON EXTRACT(HOUR FROM ce.consumed_at) = hs.hour_num 
      AND DATE(ce.consumed_at) = $2::DATE
      AND ce.user_id = $1
    GROUP BY hs.hour_num
    ORDER BY hs.hour_num ASC
  `;
  const result = await query(sql, [userId, dateStr]);
  return result.rows;
};
