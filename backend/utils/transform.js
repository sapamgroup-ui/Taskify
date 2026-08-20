function transformTask(task) {
  if (!task) return task;
  return {
    ...task,
    budget: { min: task.budget_min, max: task.budget_max, currency: task.currency },
    location: {
      address: task.location_address,
      city: task.location_city,
      state: task.location_state,
      pincode: task.location_pincode,
      lat: task.location_lat,
      lng: task.location_lng
    },
    scheduledDate: task.scheduled_date,
    scheduledTime: task.scheduled_time,
    poster: task.poster,
    assignedTo: task.assignedTo || task.assigned_to_profile || null,
    createdAt: task.created_at,
    updatedAt: task.updated_at
  };
}

function transformTasks(tasks) {
  if (!tasks) return [];
  return Array.isArray(tasks) ? tasks.map(transformTask) : [transformTask(tasks)];
}

module.exports = { transformTask, transformTasks };
