# 🏭 Warehouse Backend Implementation Requirements

## 🎯 **CRITICAL BACKEND CHANGES NEEDED**

This document outlines all the backend API endpoints and database changes required to support the enhanced warehouse management system with role-based task management.

## 📊 **Role System Updates**

### **Database Changes Required**

#### **1. User Model Updates**
```python
# Update User model to support new warehouse roles
class User(AbstractUser):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('warehouse_manager', 'Warehouse Manager'),  # NEW ROLE
        ('warehouse_worker', 'Warehouse Worker'),    # NEW ROLE
        ('warehouse', 'Warehouse Staff'),            # LEGACY - Keep for backward compatibility
        ('delivery', 'Delivery'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='warehouse_worker')
    
    # Additional fields for warehouse workers
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    shift_start = models.TimeField(null=True, blank=True)
    shift_end = models.TimeField(null=True, blank=True)
    is_active_worker = models.BooleanField(default=True)
    skills = models.ManyToManyField('TaskType', blank=True)  # Worker skills/specializations
```

#### **2. Permission System**
```python
# Create permission groups for new roles
def create_warehouse_permissions():
    # Warehouse Manager permissions
    warehouse_manager_permissions = [
        'add_task', 'change_task', 'delete_task', 'view_task',
        'add_order', 'change_order', 'view_order',
        'view_analytics', 'manage_workers', 'manage_inventory'
    ]
    
    # Warehouse Worker permissions  
    warehouse_worker_permissions = [
        'view_task', 'change_own_task', 'view_own_orders',
        'add_stockmovement', 'view_materials'
    ]
```

## 📋 **Task Management API Endpoints**

### **1. Task Types Management**
```python
# /api/tasks/task_types/
class TaskTypeViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for task types
    """
    queryset = TaskType.objects.all()
    serializer_class = TaskTypeSerializer
    permission_classes = [IsAuthenticated]

# Model
class TaskType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    estimated_duration = models.IntegerField(help_text="Duration in minutes")
    required_skills = models.JSONField(default=list)
    color_code = models.CharField(max_length=7, default="#007bff")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### **2. Task Templates Management**
```python
# /api/tasks/templates/
class TaskTemplateViewSet(viewsets.ModelViewSet):
    """
    Pre-defined task templates for common workflows
    """
    queryset = TaskTemplate.objects.all()
    serializer_class = TaskTemplateSerializer

# Model
class TaskTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    task_type = models.ForeignKey(TaskType, on_delete=models.CASCADE)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    estimated_duration = models.IntegerField()
    instructions = models.TextField(blank=True)
    materials_needed = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
```

### **3. Enhanced Task Model**
```python
class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('started', 'Started'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    # Basic fields
    title = models.CharField(max_length=200)
    description = models.TextField()
    task_type = models.ForeignKey(TaskType, on_delete=models.CASCADE)
    order = models.ForeignKey('Order', on_delete=models.CASCADE)  # REQUIRED: Link to order
    
    # Assignment
    assigned_worker = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    
    # Status and priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Time tracking
    estimated_duration = models.IntegerField(help_text="Duration in minutes")
    actual_duration = models.IntegerField(null=True, blank=True)
    time_elapsed = models.IntegerField(default=0, help_text="Elapsed time in seconds")
    is_running = models.BooleanField(default=False)
    
    # Deadlines
    deadline = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional fields
    instructions = models.TextField(blank=True)
    materials_needed = models.TextField(blank=True)
    completion_notes = models.TextField(blank=True)
    progress_percentage = models.IntegerField(default=0)
    
    # Approval workflow
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_tasks')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
```

### **4. Task Creation in Orders**
```python
# /api/orders/{id}/create_task/
@action(detail=True, methods=['post'])
def create_task(self, request, pk=None):
    """
    Create a task within a specific order
    """
    order = self.get_object()
    serializer = TaskCreateSerializer(data=request.data)
    
    if serializer.is_valid():
        task = serializer.save(
            order=order,
            created_by=request.user
        )
        
        # Send notification to assigned worker
        if task.assigned_worker:
            create_notification(
                user=task.assigned_worker,
                message=f"New task assigned: {task.title}",
                task=task,
                priority='normal'
            )
        
        return Response(TaskSerializer(task).data, status=201)
    return Response(serializer.errors, status=400)
```

### **5. Bulk Task Assignment**
```python
# /api/tasks/tasks/bulk_assign/
@action(detail=False, methods=['post'])
def bulk_assign(self, request):
    """
    Assign multiple tasks to a worker
    """
    task_ids = request.data.get('task_ids', [])
    worker_id = request.data.get('worker_id')
    
    if not task_ids or not worker_id:
        return Response({'error': 'task_ids and worker_id required'}, status=400)
    
    try:
        worker = User.objects.get(id=worker_id)
        tasks = Task.objects.filter(id__in=task_ids)
        
        updated_count = tasks.update(
            assigned_worker=worker,
            status='assigned'
        )
        
        # Send bulk notification
        create_notification(
            user=worker,
            message=f"{updated_count} tasks assigned to you",
            priority='normal'
        )
        
        return Response({
            'message': f'{updated_count} tasks assigned successfully',
            'assigned_count': updated_count
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Worker not found'}, status=404)
```

### **6. Task Status Filtering**
```python
# /api/tasks/tasks/?status=all
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Task.objects.all()
        status = self.request.query_params.get('status', None)
        
        if status and status != 'all':
            queryset = queryset.filter(status=status)
            
        # Role-based filtering
        if self.request.user.role == 'warehouse_worker':
            queryset = queryset.filter(assigned_worker=self.request.user)
        elif self.request.user.role in ['warehouse_manager', 'admin', 'owner']:
            # Can see all tasks
            pass
            
        return queryset.order_by('-created_at')
```

## 🔄 **Real-time Updates API**

### **1. Real-time Updates Endpoint**
```python
# /api/tasks/dashboard/real_time_updates/
@api_view(['GET'])
def get_real_time_updates(request):
    """
    Get real-time updates for dashboard
    """
    since = request.GET.get('since')
    user = request.user
    
    updates = {
        'has_updates': False,
        'notifications': [],
        'task_updates': [],
        'stock_alerts': [],
        'timestamp': timezone.now().isoformat()
    }
    
    # Get notifications since last check
    notifications_qs = Notification.objects.filter(user=user)
    if since:
        since_dt = parse_datetime(since)
        notifications_qs = notifications_qs.filter(created_at__gt=since_dt)
    
    notifications = notifications_qs.order_by('-created_at')[:10]
    if notifications.exists():
        updates['has_updates'] = True
        updates['notifications'] = NotificationSerializer(notifications, many=True).data
    
    # Get task updates for managers
    if user.role in ['warehouse_manager', 'admin', 'owner']:
        task_updates_qs = Task.objects.filter(
            status__in=['started', 'completed', 'paused']
        )
        if since:
            task_updates_qs = task_updates_qs.filter(updated_at__gt=since_dt)
        
        task_updates = task_updates_qs[:20]
        if task_updates.exists():
            updates['has_updates'] = True
            updates['task_updates'] = TaskUpdateSerializer(task_updates, many=True).data
    
    # Get stock alerts
    if user.role in ['warehouse_manager', 'admin', 'owner', 'warehouse_worker']:
        stock_alerts = Material.objects.filter(
            current_stock__lte=models.F('minimum_stock_level')
        )[:10]
        if stock_alerts.exists():
            updates['has_updates'] = True
            updates['stock_alerts'] = StockAlertSerializer(stock_alerts, many=True).data
    
    return Response(updates)
```

### **2. Enhanced Task Actions**
```python
# /api/tasks/tasks/{id}/action/
@action(detail=True, methods=['post'])
def perform_action(self, request, pk=None):
    """
    Enhanced task actions with time tracking
    """
    task = self.get_object()
    action = request.data.get('action')
    reason = request.data.get('reason', '')
    
    # Permission check
    if task.assigned_worker != request.user and request.user.role not in ['admin', 'owner', 'warehouse_manager']:
        return Response({'error': 'Permission denied'}, status=403)
    
    if action == 'start':
        task.status = 'started'
        task.is_running = True
        task.started_at = timezone.now()
        
        # Create time session
        TaskTimeSession.objects.create(
            task=task,
            worker=request.user,
            start_time=timezone.now()
        )
        
    elif action == 'pause':
        task.status = 'paused'
        task.is_running = False
        
        # End current time session
        current_session = TaskTimeSession.objects.filter(
            task=task,
            worker=request.user,
            end_time__isnull=True
        ).first()
        
        if current_session:
            current_session.end_time = timezone.now()
            current_session.save()
            
            # Update total elapsed time
            session_duration = (current_session.end_time - current_session.start_time).total_seconds()
            task.time_elapsed += int(session_duration)
    
    elif action == 'resume':
        task.status = 'started'
        task.is_running = True
        
        # Create new time session
        TaskTimeSession.objects.create(
            task=task,
            worker=request.user,
            start_time=timezone.now()
        )
    
    elif action == 'complete':
        task.status = 'completed'
        task.is_running = False
        task.completed_at = timezone.now()
        task.completion_notes = reason
        task.progress_percentage = 100
        
        # End current time session
        current_session = TaskTimeSession.objects.filter(
            task=task,
            worker=request.user,
            end_time__isnull=True
        ).first()
        
        if current_session:
            current_session.end_time = timezone.now()
            current_session.save()
            
            session_duration = (current_session.end_time - current_session.start_time).total_seconds()
            task.time_elapsed += int(session_duration)
        
        # Calculate actual duration
        if task.started_at:
            task.actual_duration = int((task.completed_at - task.started_at).total_seconds() / 60)
        
        # Notify supervisors
        supervisors = User.objects.filter(role__in=['warehouse_manager', 'admin', 'owner'])
        for supervisor in supervisors:
            create_notification(
                user=supervisor,
                message=f"Task completed: {task.title} by {request.user.get_full_name()}",
                task=task,
                priority='normal'
            )
    
    task.save()
    
    return Response({
        'status': 'success',
        'new_status': task.status,
        'is_running': task.is_running,
        'time_elapsed': task.time_elapsed,
        'progress_percentage': task.progress_percentage,
        'can_start': task.status == 'assigned',
        'can_pause': task.status == 'started',
        'can_resume': task.status == 'paused',
        'can_complete': task.status in ['started', 'paused']
    })
```

## 📊 **Dashboard API Enhancements**

### **1. Worker Dashboard**
```python
# /api/tasks/dashboard/worker_dashboard/
@api_view(['GET'])
def worker_dashboard(request):
    """
    Dashboard data for warehouse workers
    """
    user = request.user
    today = timezone.now().date()
    
    # Get worker's tasks
    my_tasks = Task.objects.filter(assigned_worker=user)
    
    # Tasks by status
    task_stats = {
        'total_tasks': my_tasks.count(),
        'active_tasks': my_tasks.filter(status='started').count(),
        'pending_tasks': my_tasks.filter(status='assigned').count(),
        'completed_today': my_tasks.filter(
            status='completed',
            completed_at__date=today
        ).count(),
    }
    
    # Recent tasks
    recent_tasks = my_tasks.order_by('-created_at')[:10]
    
    return Response({
        'task_stats': task_stats,
        'recent_tasks': TaskSerializer(recent_tasks, many=True).data,
        'worker_info': {
            'name': user.get_full_name(),
            'employee_id': user.employee_id,
            'shift_start': user.shift_start,
            'shift_end': user.shift_end,
        }
    })
```

### **2. Supervisor Dashboard**
```python
# /api/tasks/dashboard/supervisor_dashboard/
@api_view(['GET'])
def supervisor_dashboard(request):
    """
    Dashboard data for warehouse managers/supervisors
    """
    today = timezone.now().date()
    
    # Overall statistics
    stats = {
        'total_orders': Order.objects.filter(status__in=['processing', 'in_production']).count(),
        'total_tasks': Task.objects.count(),
        'active_tasks': Task.objects.filter(status='started').count(),
        'completed_today': Task.objects.filter(completed_at__date=today).count(),
        'overdue_tasks': Task.objects.filter(
            deadline__lt=timezone.now(),
            status__in=['assigned', 'started', 'paused']
        ).count(),
        'workers_online': User.objects.filter(
            role__in=['warehouse_worker', 'warehouse'],
            is_active_worker=True,
            last_login__date=today
        ).count(),
    }
    
    # Recent task activities
    recent_activities = Task.objects.filter(
        updated_at__date=today
    ).order_by('-updated_at')[:20]
    
    # Worker productivity
    worker_productivity = User.objects.filter(
        role__in=['warehouse_worker', 'warehouse']
    ).annotate(
        tasks_completed_today=Count(
            'assigned_tasks',
            filter=Q(assigned_tasks__completed_at__date=today)
        ),
        active_tasks=Count(
            'assigned_tasks',
            filter=Q(assigned_tasks__status='started')
        )
    )
    
    return Response({
        'stats': stats,
        'recent_activities': TaskActivitySerializer(recent_activities, many=True).data,
        'worker_productivity': WorkerProductivitySerializer(worker_productivity, many=True).data,
    })
```

### **3. Tasks by Order Endpoint**
```python
# /api/tasks/dashboard/tasks_by_order/
@api_view(['GET'])
def tasks_by_order(request):
    """
    Get tasks organized by orders for workers
    """
    user = request.user
    
    if user.role == 'warehouse_worker':
        # Workers see only their tasks
        tasks = Task.objects.filter(assigned_worker=user)
    else:
        # Managers see all tasks
        tasks = Task.objects.all()
    
    # Group tasks by order
    orders_with_tasks = {}
    for task in tasks.select_related('order', 'assigned_worker'):
        order = task.order
        if order.id not in orders_with_tasks:
            orders_with_tasks[order.id] = {
                'order_info': {
                    'id': order.id,
                    'order_number': order.order_number,
                    'customer_name': order.customer_name,
                    'urgency': order.urgency,
                    'delivery_deadline': order.delivery_deadline,
                    'total_amount': order.total_amount,
                },
                'tasks': []
            }
        
        orders_with_tasks[order.id]['tasks'].append(task)
    
    # Convert to list and add summary
    result = []
    for order_data in orders_with_tasks.values():
        tasks_list = order_data['tasks']
        summary = {
            'total_tasks': len(tasks_list),
            'active_tasks': len([t for t in tasks_list if t.status == 'started']),
            'completed_tasks': len([t for t in tasks_list if t.status == 'completed']),
            'pending_tasks': len([t for t in tasks_list if t.status == 'assigned']),
        }
        
        result.append({
            'order_info': order_data['order_info'],
            'tasks': TaskSerializer(tasks_list, many=True).data,
            'summary': summary
        })
    
    return Response({
        'orders_with_tasks': result,
        'summary': {
            'total_orders': len(result),
            'total_tasks': sum(len(order['tasks']) for order in orders_with_tasks.values()),
            'active_tasks': Task.objects.filter(
                assigned_worker=user if user.role == 'warehouse_worker' else None,
                status='started'
            ).count()
        }
    })
```

## 🔔 **Notification System**

### **1. Notification Model**
```python
class Notification(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    is_read = models.BooleanField(default=False)
    
    # Optional links
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True)
    order = models.ForeignKey('Order', on_delete=models.CASCADE, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
```

### **2. Notification Endpoints**
```python
# /api/tasks/notifications/mark_all_read/
@api_view(['POST'])
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for current user
    """
    updated_count = Notification.objects.filter(
        user=request.user,
        is_read=False
    ).update(
        is_read=True,
        read_at=timezone.now()
    )
    
    return Response({
        'message': f'{updated_count} notifications marked as read',
        'updated_count': updated_count
    })
```

## 📦 **Inventory Integration**

### **1. Quick Stock Entry Enhancement**
```python
# /api/inventory/materials/quick_stock_entry/
@api_view(['POST'])
def quick_stock_entry(request):
    """
    Enhanced quick stock entry with batch support
    """
    entries = request.data.get('entries', [])
    
    if not entries:
        return Response({'error': 'No entries provided'}, status=400)
    
    created_movements = []
    
    for entry_data in entries:
        try:
            material = Material.objects.get(id=entry_data['material_id'])
            
            # Create stock movement
            movement = StockMovement.objects.create(
                material=material,
                movement_type=entry_data['movement_type'],  # 'in' or 'out'
                quantity=entry_data['quantity'],
                reason=entry_data.get('reason', ''),
                location=entry_data.get('location', ''),
                batch_number=entry_data.get('batch_number', ''),
                expiry_date=entry_data.get('expiry_date'),
                created_by=request.user
            )
            
            # Update material stock
            if entry_data['movement_type'] == 'in':
                material.current_stock += entry_data['quantity']
            else:
                material.current_stock -= entry_data['quantity']
            
            material.save()
            created_movements.append(movement)
            
        except Material.DoesNotExist:
            return Response({
                'error': f'Material with ID {entry_data["material_id"]} not found'
            }, status=404)
    
    return Response({
        'message': f'{len(created_movements)} stock movements created',
        'movements': StockMovementSerializer(created_movements, many=True).data
    })
```

## 🔐 **Permission System**

### **1. Role-based Permissions**
```python
class IsWarehouseManager(BasePermission):
    """
    Permission for warehouse managers and above
    """
    def has_permission(self, request, view):
        return request.user.role in ['warehouse_manager', 'admin', 'owner']

class IsWarehouseWorker(BasePermission):
    """
    Permission for warehouse workers and above
    """
    def has_permission(self, request, view):
        return request.user.role in ['warehouse_worker', 'warehouse_manager', 'admin', 'owner']

class CanManageTasks(BasePermission):
    """
    Permission to create and assign tasks
    """
    def has_permission(self, request, view):
        return request.user.role in ['warehouse_manager', 'admin', 'owner']
```

## 📈 **Analytics Endpoints**

### **1. Worker Productivity**
```python
# /api/analytics/worker_productivity/
@api_view(['GET'])
def worker_productivity(request):
    """
    Get worker productivity metrics
    """
    date_from = request.GET.get('date_from', timezone.now().date() - timedelta(days=7))
    date_to = request.GET.get('date_to', timezone.now().date())
    
    workers = User.objects.filter(
        role__in=['warehouse_worker', 'warehouse']
    ).annotate(
        tasks_completed=Count(
            'assigned_tasks',
            filter=Q(
                assigned_tasks__status='completed',
                assigned_tasks__completed_at__date__range=[date_from, date_to]
            )
        ),
        avg_completion_time=Avg(
            'assigned_tasks__actual_duration',
            filter=Q(
                assigned_tasks__status='completed',
                assigned_tasks__completed_at__date__range=[date_from, date_to]
            )
        ),
        total_work_time=Sum(
            'assigned_tasks__time_elapsed',
            filter=Q(
                assigned_tasks__completed_at__date__range=[date_from, date_to]
            )
        )
    )
    
    return Response(WorkerProductivitySerializer(workers, many=True).data)
```

## 🚀 **Migration Scripts**

### **1. Role Migration**
```python
# Create migration for new roles
from django.db import migrations

def update_warehouse_roles(apps, schema_editor):
    User = apps.get_model('users', 'User')
    
    # Update existing 'warehouse' role users
    warehouse_users = User.objects.filter(role='warehouse')
    
    for user in warehouse_users:
        # Determine if user should be manager or worker based on permissions
        if user.is_staff or user.groups.filter(name__icontains='manager').exists():
            user.role = 'warehouse_manager'
        else:
            user.role = 'warehouse_worker'
        user.save()

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(update_warehouse_roles),
    ]
```

## 📋 **API Endpoint Summary**

### **New Endpoints Required:**

```
# Task Management
POST   /api/orders/{id}/create_task/           # Create task in order
GET    /api/tasks/task_types/                  # Get task types
GET    /api/tasks/templates/                   # Get task templates
PUT    /api/tasks/tasks/{id}/                  # Update task
DELETE /api/tasks/tasks/{id}/                  # Delete task
GET    /api/tasks/tasks/?status={status}       # Filter tasks by status
POST   /api/tasks/tasks/{id}/assign_worker/    # Assign worker to task
POST   /api/tasks/tasks/bulk_assign/           # Bulk assign tasks
POST   /api/tasks/tasks/{id}/action/           # Enhanced task actions

# Dashboard
GET    /api/tasks/dashboard/worker_dashboard/     # Worker dashboard data
GET    /api/tasks/dashboard/supervisor_dashboard/ # Supervisor dashboard data
GET    /api/tasks/dashboard/tasks_by_order/       # Tasks organized by orders

# Real-time
GET    /api/tasks/dashboard/real_time_updates/    # Real-time updates

# Notifications  
POST   /api/tasks/notifications/mark_all_read/    # Mark all notifications read

# Inventory
POST   /api/inventory/materials/quick_stock_entry/ # Enhanced stock entry

# Analytics
GET    /api/analytics/worker_productivity/        # Worker productivity metrics
```

## 🎯 **Database Tables to Create/Update**

1. **TaskType** - New table for task categories
2. **TaskTemplate** - New table for task templates  
3. **TaskTimeSession** - New table for time tracking
4. **Notification** - Enhanced notification system
5. **User** - Add warehouse role fields
6. **Task** - Add order relationship and enhanced fields
7. **StockMovement** - Enhanced with batch/expiry tracking

## 🔧 **Settings Updates**

```python
# Add to Django settings
INSTALLED_APPS = [
    # ... existing apps
    'warehouse_management',
    'task_management', 
    'notification_system',
]

# Celery for background tasks
CELERY_BEAT_SCHEDULE = {
    'send-task-reminders': {
        'task': 'tasks.send_task_reminders',
        'schedule': crontab(minute=0, hour=8),  # Daily at 8 AM
    },
    'update-task-progress': {
        'task': 'tasks.update_running_tasks',
        'schedule': 30.0,  # Every 30 seconds
    },
}
```

## 📞 **Implementation Priority**

### **Phase 1: Critical (Week 1)**
1. ✅ Role system updates
2. ✅ Task model enhancements  
3. ✅ Basic task CRUD operations
4. ✅ Order-task relationship

### **Phase 2: Core Features (Week 2)**
1. ✅ Task assignment and actions
2. ✅ Time tracking system
3. ✅ Dashboard endpoints
4. ✅ Real-time updates

### **Phase 3: Advanced Features (Week 3)**
1. ✅ Notification system
2. ✅ Analytics endpoints
3. ✅ Bulk operations
4. ✅ Template system

## 🎉 **Backend Status**

**🚨 CRITICAL: All these backend endpoints MUST be implemented for the frontend to work properly!**

The frontend is 100% ready and waiting for these backend changes. Once implemented, the enhanced warehouse management system will be fully operational.

---

*Backend Requirements Document*  
*Created: December 16, 2024*  
*Status: 🔄 AWAITING BACKEND IMPLEMENTATION*  
*Frontend Status: ✅ READY FOR INTEGRATION*