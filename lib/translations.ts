import { AppLocale } from '@/components/i18n/LanguageProvider';

export interface Translation {
  [key: string]: string | Translation;
}

export const translations: Record<AppLocale, Translation> = {
  en: {
    common: {
      loading: 'Loading...',
      refresh: 'Refresh',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      search: 'Search',
    },
    operations: {
      dashboard: {
        title: 'Operations Dashboard',
        subtitle: 'Real-time monitoring and management of cleaning operations',
        lastUpdated: 'Last updated',
      },
      stats: {
        totalJobsToday: 'Total Jobs Today',
        activeJobs: 'Active Jobs',
        availableProviders: 'Available Providers',
        revenueToday: 'Revenue Today',
        unassigned: 'unassigned',
        allAssigned: 'All assigned',
        completed: 'completed',
        readyForAssignment: 'Ready for assignment',
        fromJobs: 'From {count} jobs',
      },
      performance: {
        responseTime: 'Response Time',
        customerSatisfaction: 'Customer Satisfaction',
        efficiency: 'Efficiency',
        averageAssignmentTime: 'Average assignment time',
        averageRating: 'Average rating',
        completionRate: 'Completion rate',
        excellent: 'Excellent',
        needsImprovement: 'Needs Improvement',
        good: 'Good',
        high: 'High',
        moderate: 'Moderate',
      },
      tabs: {
        dashboard: 'Dashboard',
        liveJobs: 'Live Jobs',
        notifications: 'Notifications',
        activity: 'Activity',
        settings: 'Settings',
      },
      activity: {
        recentActivity: 'Recent Activity',
        noRecentActivity: 'No recent activity',
      },
      settings: {
        dashboardSettings: 'Dashboard Settings',
        autoAssignmentSettings: 'Auto-Assignment Settings',
        assignmentStrategy: 'Assignment Strategy',
        autoAssignment: 'Auto-Assignment',
        notificationSettings: 'Notification Settings',
        displaySettings: 'Display Settings',
        refreshInterval: 'Refresh Interval',
        defaultView: 'Default View',
        saveSettings: 'Save Settings',
        strategies: {
          balanced: 'Balanced (Distance + Workload + Rating)',
          distance: 'Closest Provider',
          workload: 'Least Busy Provider',
          rating: 'Highest Rated Provider',
        },
        assignmentModes: {
          manual: 'Manual Assignment Only',
          auto: 'Automatic Assignment',
        },
        notifications: {
          emailUnassigned: 'Email notifications for unassigned jobs',
          smsUrgent: 'SMS alerts for urgent jobs',
          pushStatus: 'Push notifications for status changes',
        },
        intervals: {
          thirtySeconds: '30 seconds',
          oneMinute: '1 minute',
          fiveMinutes: '5 minutes',
        },
        views: {
          map: 'Map View',
          list: 'List View',
          calendar: 'Calendar View',
        },
      },
    },
  },
  es: {
    common: {
      loading: 'Cargando...',
      refresh: 'Actualizar',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      search: 'Buscar',
    },
    operations: {
      dashboard: {
        title: 'Panel de Operaciones',
        subtitle: 'Monitoreo y gestión en tiempo real de operaciones de limpieza',
        lastUpdated: 'Última actualización',
      },
      stats: {
        totalJobsToday: 'Trabajos Totales Hoy',
        activeJobs: 'Trabajos Activos',
        availableProviders: 'Proveedores Disponibles',
        revenueToday: 'Ingresos Hoy',
        unassigned: 'sin asignar',
        allAssigned: 'Todos asignados',
        completed: 'completados',
        readyForAssignment: 'Listos para asignación',
        fromJobs: 'De {count} trabajos',
      },
      performance: {
        responseTime: 'Tiempo de Respuesta',
        customerSatisfaction: 'Satisfacción del Cliente',
        efficiency: 'Eficiencia',
        averageAssignmentTime: 'Tiempo promedio de asignación',
        averageRating: 'Calificación promedio',
        completionRate: 'Tasa de finalización',
        excellent: 'Excelente',
        needsImprovement: 'Necesita Mejorar',
        good: 'Bueno',
        high: 'Alto',
        moderate: 'Moderado',
      },
      tabs: {
        dashboard: 'Panel',
        liveJobs: 'Trabajos en Vivo',
        notifications: 'Notificaciones',
        activity: 'Actividad',
        settings: 'Configuración',
      },
      activity: {
        recentActivity: 'Actividad Reciente',
        noRecentActivity: 'Sin actividad reciente',
      },
      settings: {
        dashboardSettings: 'Configuración del Panel',
        autoAssignmentSettings: 'Configuración de Asignación Automática',
        assignmentStrategy: 'Estrategia de Asignación',
        autoAssignment: 'Asignación Automática',
        notificationSettings: 'Configuración de Notificaciones',
        displaySettings: 'Configuración de Pantalla',
        refreshInterval: 'Intervalo de Actualización',
        defaultView: 'Vista Predeterminada',
        saveSettings: 'Guardar Configuración',
        strategies: {
          balanced: 'Balanceado (Distancia + Carga + Calificación)',
          distance: 'Proveedor Más Cercano',
          workload: 'Proveedor Menos Ocupado',
          rating: 'Proveedor Mejor Calificado',
        },
        assignmentModes: {
          manual: 'Solo Asignación Manual',
          auto: 'Asignación Automática',
        },
        notifications: {
          emailUnassigned: 'Notificaciones por email para trabajos sin asignar',
          smsUrgent: 'Alertas SMS para trabajos urgentes',
          pushStatus: 'Notificaciones push para cambios de estado',
        },
        intervals: {
          thirtySeconds: '30 segundos',
          oneMinute: '1 minuto',
          fiveMinutes: '5 minutos',
        },
        views: {
          map: 'Vista de Mapa',
          list: 'Vista de Lista',
          calendar: 'Vista de Calendario',
        },
      },
    },
  },
  uk: {
    common: {
      loading: 'Завантаження...',
      refresh: 'Оновити',
      save: 'Зберегти',
      cancel: 'Скасувати',
      delete: 'Видалити',
      edit: 'Редагувати',
      close: 'Закрити',
      search: 'Пошук',
    },
    operations: {
      dashboard: {
        title: 'Панель Операцій',
        subtitle: 'Моніторинг і управління операціями прибирання в реальному часі',
        lastUpdated: 'Останнє оновлення',
      },
      stats: {
        totalJobsToday: 'Всього Робіт Сьогодні',
        activeJobs: 'Активні Роботи',
        availableProviders: 'Доступні Постачальники',
        revenueToday: 'Дохід Сьогодні',
        unassigned: 'не призначено',
        allAssigned: 'Всі призначені',
        completed: 'завершено',
        readyForAssignment: 'Готові до призначення',
        fromJobs: 'З {count} робіт',
      },
      performance: {
        responseTime: 'Час Відгуку',
        customerSatisfaction: 'Задоволеність Клієнтів',
        efficiency: 'Ефективність',
        averageAssignmentTime: 'Середній час призначення',
        averageRating: 'Середня оцінка',
        completionRate: 'Рівень завершення',
        excellent: 'Відмінно',
        needsImprovement: 'Потребує Покращення',
        good: 'Добре',
        high: 'Високий',
        moderate: 'Помірний',
      },
      tabs: {
        dashboard: 'Панель',
        liveJobs: 'Поточні Роботи',
        notifications: 'Сповіщення',
        activity: 'Активність',
        settings: 'Налаштування',
      },
      activity: {
        recentActivity: 'Недавня Активність',
        noRecentActivity: 'Немає недавньої активності',
      },
      settings: {
        dashboardSettings: 'Налаштування Панелі',
        autoAssignmentSettings: 'Налаштування Автоматичного Призначення',
        assignmentStrategy: 'Стратегія Призначення',
        autoAssignment: 'Автоматичне Призначення',
        notificationSettings: 'Налаштування Сповіщень',
        displaySettings: 'Налаштування Відображення',
        refreshInterval: 'Інтервал Оновлення',
        defaultView: 'Вигляд За Замовчуванням',
        saveSettings: 'Зберегти Налаштування',
        strategies: {
          balanced: 'Збалансований (Відстань + Навантаження + Рейтинг)',
          distance: 'Найближчий Постачальник',
          workload: 'Найменш Зайнятий Постачальник',
          rating: 'Найкраще Оцінений Постачальник',
        },
        assignmentModes: {
          manual: 'Тільки Ручне Призначення',
          auto: 'Автоматичне Призначення',
        },
        notifications: {
          emailUnassigned: 'Email сповіщення для не призначених робіт',
          smsUrgent: 'SMS сповіщення для термінових робіт',
          pushStatus: 'Push сповіщення для змін статусу',
        },
        intervals: {
          thirtySeconds: '30 секунд',
          oneMinute: '1 хвилина',
          fiveMinutes: '5 хвилин',
        },
        views: {
          map: 'Вигляд Карти',
          list: 'Вигляд Списку',
          calendar: 'Вигляд Календаря',
        },
      },
    },
  },
  pt: {
    common: {
      loading: 'Carregando...',
      refresh: 'Atualizar',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
      search: 'Pesquisar',
    },
    operations: {
      dashboard: {
        title: 'Painel de Operações',
        subtitle: 'Monitoramento e gestão em tempo real de operações de limpeza',
        lastUpdated: 'Última atualização',
      },
      stats: {
        totalJobsToday: 'Total de Trabalhos Hoje',
        activeJobs: 'Trabalhos Ativos',
        availableProviders: 'Provedores Disponíveis',
        revenueToday: 'Receita Hoje',
        unassigned: 'não atribuído',
        allAssigned: 'Todos atribuídos',
        completed: 'concluído',
        readyForAssignment: 'Pronto para atribuição',
        fromJobs: 'De {count} trabalhos',
      },
      performance: {
        responseTime: 'Tempo de Resposta',
        customerSatisfaction: 'Satisfação do Cliente',
        efficiency: 'Eficiência',
        averageAssignmentTime: 'Tempo médio de atribuição',
        averageRating: 'Avaliação média',
        completionRate: 'Taxa de conclusão',
        excellent: 'Excelente',
        needsImprovement: 'Precisa Melhorar',
        good: 'Bom',
        high: 'Alto',
        moderate: 'Moderado',
      },
      tabs: {
        dashboard: 'Painel',
        liveJobs: 'Trabalhos ao Vivo',
        notifications: 'Notificações',
        activity: 'Atividade',
        settings: 'Configurações',
      },
      activity: {
        recentActivity: 'Atividade Recente',
        noRecentActivity: 'Nenhuma atividade recente',
      },
      settings: {
        dashboardSettings: 'Configurações do Painel',
        autoAssignmentSettings: 'Configurações de Atribuição Automática',
        assignmentStrategy: 'Estratégia de Atribuição',
        autoAssignment: 'Atribuição Automática',
        notificationSettings: 'Configurações de Notificação',
        displaySettings: 'Configurações de Exibição',
        refreshInterval: 'Intervalo de Atualização',
        defaultView: 'Visualização Padrão',
        saveSettings: 'Salvar Configurações',
        strategies: {
          balanced: 'Equilibrado (Distância + Carga + Avaliação)',
          distance: 'Provedor Mais Próximo',
          workload: 'Provedor Menos Ocupado',
          rating: 'Provedor Mais Bem Avaliado',
        },
        assignmentModes: {
          manual: 'Apenas Atribuição Manual',
          auto: 'Atribuição Automática',
        },
        notifications: {
          emailUnassigned: 'Notificações por email para trabalhos não atribuídos',
          smsUrgent: 'Alertas SMS para trabalhos urgentes',
          pushStatus: 'Notificações push para mudanças de status',
        },
        intervals: {
          thirtySeconds: '30 segundos',
          oneMinute: '1 minuto',
          fiveMinutes: '5 minutos',
        },
        views: {
          map: 'Visualização de Mapa',
          list: 'Visualização de Lista',
          calendar: 'Visualização de Calendário',
        },
      },
    },
  },
  'fr-CA': {
    common: {
      loading: 'Chargement...',
      refresh: 'Actualiser',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      search: 'Rechercher',
    },
    operations: {
      dashboard: {
        title: 'Tableau de Bord des Opérations',
        subtitle: 'Surveillance et gestion en temps réel des opérations de nettoyage',
        lastUpdated: 'Dernière mise à jour',
      },
      stats: {
        totalJobsToday: 'Total des Tâches Aujourd\'hui',
        activeJobs: 'Tâches Actives',
        availableProviders: 'Fournisseurs Disponibles',
        revenueToday: 'Revenus Aujourd\'hui',
        unassigned: 'non assigné',
        allAssigned: 'Tous assignés',
        completed: 'terminé',
        readyForAssignment: 'Prêt pour assignation',
        fromJobs: 'De {count} tâches',
      },
      performance: {
        responseTime: 'Temps de Réponse',
        customerSatisfaction: 'Satisfaction Client',
        efficiency: 'Efficacité',
        averageAssignmentTime: 'Temps moyen d\'assignation',
        averageRating: 'Note moyenne',
        completionRate: 'Taux de completion',
        excellent: 'Excellent',
        needsImprovement: 'À Améliorer',
        good: 'Bon',
        high: 'Élevé',
        moderate: 'Modéré',
      },
      tabs: {
        dashboard: 'Tableau de Bord',
        liveJobs: 'Tâches en Direct',
        notifications: 'Notifications',
        activity: 'Activité',
        settings: 'Paramètres',
      },
      activity: {
        recentActivity: 'Activité Récente',
        noRecentActivity: 'Aucune activité récente',
      },
      settings: {
        dashboardSettings: 'Paramètres du Tableau de Bord',
        autoAssignmentSettings: 'Paramètres d\'Assignation Automatique',
        assignmentStrategy: 'Stratégie d\'Assignation',
        autoAssignment: 'Assignation Automatique',
        notificationSettings: 'Paramètres de Notification',
        displaySettings: 'Paramètres d\'Affichage',
        refreshInterval: 'Intervalle d\'Actualisation',
        defaultView: 'Vue Par Défaut',
        saveSettings: 'Sauvegarder Paramètres',
        strategies: {
          balanced: 'Équilibré (Distance + Charge + Évaluation)',
          distance: 'Fournisseur le Plus Proche',
          workload: 'Fournisseur le Moins Occupé',
          rating: 'Fournisseur le Mieux Noté',
        },
        assignmentModes: {
          manual: 'Assignation Manuelle Seulement',
          auto: 'Assignation Automatique',
        },
        notifications: {
          emailUnassigned: 'Notifications email pour tâches non assignées',
          smsUrgent: 'Alertes SMS pour tâches urgentes',
          pushStatus: 'Notifications push pour changements de statut',
        },
        intervals: {
          thirtySeconds: '30 secondes',
          oneMinute: '1 minute',
          fiveMinutes: '5 minutes',
        },
        views: {
          map: 'Vue Carte',
          list: 'Vue Liste',
          calendar: 'Vue Calendrier',
        },
      },
    },
  },
  tr: {
    common: {
      loading: 'Yükleniyor...',
      refresh: 'Yenile',
      save: 'Kaydet',
      cancel: 'İptal',
      delete: 'Sil',
      edit: 'Düzenle',
      close: 'Kapat',
      search: 'Ara',
    },
    operations: {
      dashboard: {
        title: 'İşlemler Kontrol Paneli',
        subtitle: 'Temizlik işlemlerinin gerçek zamanlı izlenmesi ve yönetimi',
        lastUpdated: 'Son güncelleme',
      },
      stats: {
        totalJobsToday: 'Bugün Toplam İş',
        activeJobs: 'Aktif İşler',
        availableProviders: 'Mevcut Sağlayıcılar',
        revenueToday: 'Bugün Gelir',
        unassigned: 'atanmamış',
        allAssigned: 'Tümü atandı',
        completed: 'tamamlandı',
        readyForAssignment: 'Atamaya hazır',
        fromJobs: '{count} işten',
      },
      performance: {
        responseTime: 'Yanıt Süresi',
        customerSatisfaction: 'Müşteri Memnuniyeti',
        efficiency: 'Verimlilik',
        averageAssignmentTime: 'Ortalama atama süresi',
        averageRating: 'Ortalama puan',
        completionRate: 'Tamamlanma oranı',
        excellent: 'Mükemmel',
        needsImprovement: 'İyileştirme Gerekli',
        good: 'İyi',
        high: 'Yüksek',
        moderate: 'Orta',
      },
      tabs: {
        dashboard: 'Kontrol Paneli',
        liveJobs: 'Canlı İşler',
        notifications: 'Bildirimler',
        activity: 'Etkinlik',
        settings: 'Ayarlar',
      },
      activity: {
        recentActivity: 'Son Etkinlik',
        noRecentActivity: 'Son etkinlik yok',
      },
      settings: {
        dashboardSettings: 'Kontrol Paneli Ayarları',
        autoAssignmentSettings: 'Otomatik Atama Ayarları',
        assignmentStrategy: 'Atama Stratejisi',
        autoAssignment: 'Otomatik Atama',
        notificationSettings: 'Bildirim Ayarları',
        displaySettings: 'Görüntü Ayarları',
        refreshInterval: 'Yenileme Aralığı',
        defaultView: 'Varsayılan Görünüm',
        saveSettings: 'Ayarları Kaydet',
        strategies: {
          balanced: 'Dengeli (Mesafe + İş Yükü + Puan)',
          distance: 'En Yakın Sağlayıcı',
          workload: 'En Az Meşgul Sağlayıcı',
          rating: 'En Yüksek Puanlı Sağlayıcı',
        },
        assignmentModes: {
          manual: 'Sadece Manuel Atama',
          auto: 'Otomatik Atama',
        },
        notifications: {
          emailUnassigned: 'Atanmamış işler için e-posta bildirimleri',
          smsUrgent: 'Acil işler için SMS uyarıları',
          pushStatus: 'Durum değişiklikleri için push bildirimleri',
        },
        intervals: {
          thirtySeconds: '30 saniye',
          oneMinute: '1 dakika',
          fiveMinutes: '5 dakika',
        },
        views: {
          map: 'Harita Görünümü',
          list: 'Liste Görünümü',
          calendar: 'Takvim Görünümü',
        },
      },
    },
  },
};

export function useTranslation(locale: AppLocale) {
  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = translations[locale];
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English if key not found
        current = translations.en;
        for (const fallbackKey of keys) {
          if (current && typeof current === 'object' && fallbackKey in current) {
            current = current[fallbackKey];
          } else {
            return key; // Return key if not found even in English
          }
        }
        break;
      }
    }
    
    return typeof current === 'string' ? current : key;
  };

  return { t };
}