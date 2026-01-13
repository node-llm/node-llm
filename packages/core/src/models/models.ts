export const modelsData = [
  {
    "id": "anthropic/claude-3.5-haiku",
    "name": "Claude Haiku 3.5",
    "provider": "openrouter",
    "family": "claude-haiku",
    "created_at": "2024-10-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-07-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.8,
          "output_per_million": 4,
          "cached_input_per_million": 0.08,
          "reasoning_output_per_million": 4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.8,
      "output": 8192,
      "cache_read": 0.08,
      "cache_write": 1,
      "context": 200000
    }
  },
  {
    "id": "anthropic/claude-3.7-sonnet",
    "name": "Claude Sonnet 3.7",
    "provider": "openrouter",
    "family": "claude-sonnet",
    "created_at": "2025-02-19 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 75,
          "cached_input_per_million": 1.5,
          "reasoning_output_per_million": 75
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 128000,
      "cache_read": 1.5,
      "cache_write": 18.75,
      "context": 200000
    }
  },
  {
    "id": "anthropic/claude-haiku-4.5",
    "name": "Claude Haiku 4.5",
    "provider": "openrouter",
    "family": "claude-haiku",
    "created_at": "2025-10-15 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-02-28",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1,
          "output_per_million": 5,
          "cached_input_per_million": 0.1,
          "reasoning_output_per_million": 5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1,
      "output": 64000,
      "cache_read": 0.1,
      "cache_write": 1.25,
      "context": 200000
    }
  },
  {
    "id": "anthropic/claude-opus-4",
    "name": "Claude Opus 4",
    "provider": "openrouter",
    "family": "claude-opus",
    "created_at": "2025-05-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 32000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 75,
          "cached_input_per_million": 1.5,
          "reasoning_output_per_million": 75
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 32000,
      "cache_read": 1.5,
      "cache_write": 18.75,
      "context": 200000
    }
  },
  {
    "id": "anthropic/claude-opus-4.1",
    "name": "Claude Opus 4.1",
    "provider": "openrouter",
    "family": "claude-opus",
    "created_at": "2025-08-05 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 32000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 75,
          "cached_input_per_million": 1.5,
          "reasoning_output_per_million": 75
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 32000,
      "cache_read": 1.5,
      "cache_write": 18.75,
      "context": 200000
    }
  },
  {
    "id": "anthropic/claude-opus-4.5",
    "name": "Claude Opus 4.5",
    "provider": "openrouter",
    "family": "claude-opus",
    "created_at": "2025-11-24 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 32000,
    "knowledge_cutoff": "2025-05-30",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 5,
          "output_per_million": 25,
          "cached_input_per_million": 0.5,
          "reasoning_output_per_million": 25
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 5,
      "output": 32000,
      "cache_read": 0.5,
      "cache_write": 6.25,
      "context": 200000
    }
  },
  {
    "id": "anthropic/claude-sonnet-4",
    "name": "Claude Sonnet 4",
    "provider": "openrouter",
    "family": "claude-sonnet",
    "created_at": "2025-05-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context_over_200k": {
        "input": 6,
        "output": 22.5,
        "cache_read": 0.6,
        "cache_write": 7.5
      },
      "context": 200000
    }
  },
  {
    "id": "anthropic/claude-sonnet-4.5",
    "name": "Claude Sonnet 4.5",
    "provider": "openrouter",
    "family": "claude-sonnet",
    "created_at": "2025-09-29 00:00:00 UTC",
    "context_window": 1000000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-07-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context_over_200k": {
        "input": 6,
        "output": 22.5,
        "cache_read": 0.6,
        "cache_write": 7.5
      },
      "context": 1000000
    }
  },
  {
    "id": "claude-3-5-haiku-20241022",
    "name": "Claude Haiku 3.5",
    "provider": "anthropic",
    "family": "claude-haiku",
    "created_at": "2024-10-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-07-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.8,
          "output_per_million": 4,
          "cached_input_per_million": 0.08,
          "reasoning_output_per_million": 4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.8,
      "output": 8192,
      "cache_read": 0.08,
      "cache_write": 1,
      "context": 200000
    }
  },
  {
    "id": "claude-3-5-haiku-latest",
    "name": "Claude Haiku 3.5 (latest)",
    "provider": "anthropic",
    "family": "claude-haiku",
    "created_at": "2024-10-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-07-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.8,
          "output_per_million": 4,
          "cached_input_per_million": 0.08,
          "reasoning_output_per_million": 4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.8,
      "output": 8192,
      "cache_read": 0.08,
      "cache_write": 1,
      "context": 200000
    }
  },
  {
    "id": "claude-3-5-sonnet-20240620",
    "name": "Claude Sonnet 3.5",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2024-06-20 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-04-30",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 8192,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context": 200000
    }
  },
  {
    "id": "claude-3-5-sonnet-20241022",
    "name": "Claude Sonnet 3.5 v2",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2024-10-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-04-30",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 8192,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context": 200000
    }
  },
  {
    "id": "claude-3-7-sonnet-20250219",
    "name": "Claude Sonnet 3.7",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2025-02-19 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2024-10-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context": 200000
    }
  },
  {
    "id": "claude-3-7-sonnet-latest",
    "name": "Claude Sonnet 3.7 (latest)",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2025-02-19 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2024-10-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context": 200000
    }
  },
  {
    "id": "claude-3-haiku-20240307",
    "name": "Claude Haiku 3",
    "provider": "anthropic",
    "family": "claude-haiku",
    "created_at": "2024-03-13 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 4096,
    "knowledge_cutoff": "2023-08-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.25,
          "output_per_million": 1.25,
          "cached_input_per_million": 0.03,
          "reasoning_output_per_million": 1.25
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.25,
      "output": 4096,
      "cache_read": 0.03,
      "cache_write": 0.3,
      "context": 200000
    }
  },
  {
    "id": "claude-3-opus-20240229",
    "name": "Claude Opus 3",
    "provider": "anthropic",
    "family": "claude-opus",
    "created_at": "2024-02-29 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 4096,
    "knowledge_cutoff": "2023-08-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 75,
          "cached_input_per_million": 1.5,
          "reasoning_output_per_million": 75
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 4096,
      "cache_read": 1.5,
      "cache_write": 18.75,
      "context": 200000
    }
  },
  {
    "id": "claude-3-sonnet-20240229",
    "name": "Claude Sonnet 3",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2024-03-04 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 4096,
    "knowledge_cutoff": "2023-08-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 4096,
      "cache_read": 0.3,
      "cache_write": 0.3,
      "context": 200000
    }
  },
  {
    "id": "claude-haiku-4-5",
    "name": "Claude Haiku 4.5 (latest)",
    "provider": "anthropic",
    "family": "claude-haiku",
    "created_at": "2025-10-15 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-02-28",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1,
          "output_per_million": 5,
          "cached_input_per_million": 0.1,
          "reasoning_output_per_million": 5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1,
      "output": 64000,
      "cache_read": 0.1,
      "cache_write": 1.25,
      "context": 200000
    }
  },
  {
    "id": "claude-haiku-4-5-20251001",
    "name": "Claude Haiku 4.5",
    "provider": "anthropic",
    "family": "claude-haiku",
    "created_at": "2025-10-15 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-02-28",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1,
          "output_per_million": 5,
          "cached_input_per_million": 0.1,
          "reasoning_output_per_million": 5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1,
      "output": 64000,
      "cache_read": 0.1,
      "cache_write": 1.25,
      "context": 200000
    }
  },
  {
    "id": "claude-opus-4-0",
    "name": "Claude Opus 4 (latest)",
    "provider": "anthropic",
    "family": "claude-opus",
    "created_at": "2025-05-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 32000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 75,
          "cached_input_per_million": 1.5,
          "reasoning_output_per_million": 75
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 32000,
      "cache_read": 1.5,
      "cache_write": 18.75,
      "context": 200000
    }
  },
  {
    "id": "claude-opus-4-1",
    "name": "Claude Opus 4.1 (latest)",
    "provider": "anthropic",
    "family": "claude-opus",
    "created_at": "2025-08-05 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 32000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 75,
          "cached_input_per_million": 1.5,
          "reasoning_output_per_million": 75
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 32000,
      "cache_read": 1.5,
      "cache_write": 18.75,
      "context": 200000
    }
  },
  {
    "id": "claude-opus-4-1-20250805",
    "name": "Claude Opus 4.1",
    "provider": "anthropic",
    "family": "claude-opus",
    "created_at": "2025-08-05 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 32000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 75,
          "cached_input_per_million": 1.5,
          "reasoning_output_per_million": 75
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 32000,
      "cache_read": 1.5,
      "cache_write": 18.75,
      "context": 200000
    }
  },
  {
    "id": "claude-opus-4-20250514",
    "name": "Claude Opus 4",
    "provider": "anthropic",
    "family": "claude-opus",
    "created_at": "2025-05-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 32000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 75,
          "cached_input_per_million": 1.5,
          "reasoning_output_per_million": 75
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 32000,
      "cache_read": 1.5,
      "cache_write": 18.75,
      "context": 200000
    }
  },
  {
    "id": "claude-opus-4-5",
    "name": "Claude Opus 4.5 (latest)",
    "provider": "anthropic",
    "family": "claude-opus",
    "created_at": "2025-11-24 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 5,
          "output_per_million": 25,
          "cached_input_per_million": 0.5,
          "reasoning_output_per_million": 25
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 5,
      "output": 64000,
      "cache_read": 0.5,
      "cache_write": 6.25,
      "context": 200000
    }
  },
  {
    "id": "claude-opus-4-5-20251101",
    "name": "Claude Opus 4.5",
    "provider": "anthropic",
    "family": "claude-opus",
    "created_at": "2025-11-01 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 5,
          "output_per_million": 25,
          "cached_input_per_million": 0.5,
          "reasoning_output_per_million": 25
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 5,
      "output": 64000,
      "cache_read": 0.5,
      "cache_write": 6.25,
      "context": 200000
    }
  },
  {
    "id": "claude-sonnet-4-0",
    "name": "Claude Sonnet 4 (latest)",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2025-05-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context": 200000
    }
  },
  {
    "id": "claude-sonnet-4-20250514",
    "name": "Claude Sonnet 4",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2025-05-22 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-03-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context": 200000
    }
  },
  {
    "id": "claude-sonnet-4-5",
    "name": "Claude Sonnet 4.5 (latest)",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2025-09-29 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-07-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context": 200000
    }
  },
  {
    "id": "claude-sonnet-4-5-20250929",
    "name": "Claude Sonnet 4.5",
    "provider": "anthropic",
    "family": "claude-sonnet",
    "created_at": "2025-09-29 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-07-31",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.3,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.3,
      "cache_write": 3.75,
      "context": 200000
    }
  },
  {
    "id": "codex-mini-latest",
    "name": "Codex Mini",
    "provider": "openai",
    "family": "codex",
    "created_at": "2025-05-16 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.5,
          "output_per_million": 6,
          "cached_input_per_million": 0.375,
          "reasoning_output_per_million": 6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.5,
      "output": 100000,
      "cache_read": 0.375,
      "context": 200000
    }
  },
  {
    "id": "cognitivecomputations/dolphin3.0-mistral-24b",
    "name": "Dolphin3.0 Mistral 24B",
    "provider": "openrouter",
    "family": "mistral",
    "created_at": "2025-02-13 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 32768
    }
  },
  {
    "id": "cognitivecomputations/dolphin3.0-r1-mistral-24b",
    "name": "Dolphin3.0 R1 Mistral 24B",
    "provider": "openrouter",
    "family": "mistral",
    "created_at": "2025-02-13 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 32768
    }
  },
  {
    "id": "deepseek-chat",
    "name": "DeepSeek Chat",
    "provider": "deepseek",
    "family": "deepseek-chat",
    "created_at": "2024-12-26 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.28,
          "output_per_million": 0.42,
          "cached_input_per_million": 0.028,
          "reasoning_output_per_million": 0.42
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.28,
      "output": 8192,
      "cache_read": 0.028,
      "context": 128000
    }
  },
  {
    "id": "deepseek-reasoner",
    "name": "DeepSeek Reasoner",
    "provider": "deepseek",
    "family": "deepseek",
    "created_at": "2025-01-20 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.28,
          "output_per_million": 0.42,
          "cached_input_per_million": 0.028,
          "reasoning_output_per_million": 0.42
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.28,
      "output": 128000,
      "cache_read": 0.028,
      "context": 128000
    }
  },
  {
    "id": "deepseek/deepseek-chat-v3-0324",
    "name": "DeepSeek V3 0324",
    "provider": "openrouter",
    "family": "deepseek-v3",
    "created_at": "2025-03-24 00:00:00 UTC",
    "context_window": 16384,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 16384
    }
  },
  {
    "id": "deepseek/deepseek-chat-v3.1",
    "name": "DeepSeek-V3.1",
    "provider": "openrouter",
    "family": "deepseek-v3",
    "created_at": "2025-08-21 00:00:00 UTC",
    "context_window": 163840,
    "max_output_tokens": 163840,
    "knowledge_cutoff": "2025-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.2,
          "output_per_million": 0.8,
          "reasoning_output_per_million": 0.8
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.2,
      "output": 163840,
      "context": 163840
    }
  },
  {
    "id": "deepseek/deepseek-r1-0528-qwen3-8b:free",
    "name": "Deepseek R1 0528 Qwen3 8B (free)",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-05-29 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "deepseek/deepseek-r1-0528:free",
    "name": "R1 0528 (free)",
    "provider": "openrouter",
    "family": "deepseek-r1",
    "created_at": "2025-05-28 00:00:00 UTC",
    "context_window": 163840,
    "max_output_tokens": 163840,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 163840,
      "context": 163840
    }
  },
  {
    "id": "deepseek/deepseek-r1-distill-llama-70b",
    "name": "DeepSeek R1 Distill Llama 70B",
    "provider": "openrouter",
    "family": "deepseek-r1-distill-llama",
    "created_at": "2025-01-23 00:00:00 UTC",
    "context_window": 8192,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 8192
    }
  },
  {
    "id": "deepseek/deepseek-r1-distill-qwen-14b",
    "name": "DeepSeek R1 Distill Qwen 14B",
    "provider": "openrouter",
    "family": "qwen",
    "created_at": "2025-01-29 00:00:00 UTC",
    "context_window": 64000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 64000
    }
  },
  {
    "id": "deepseek/deepseek-r1:free",
    "name": "R1 (free)",
    "provider": "openrouter",
    "family": "deepseek-r1",
    "created_at": "2025-01-20 00:00:00 UTC",
    "context_window": 163840,
    "max_output_tokens": 163840,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 163840,
      "context": 163840
    }
  },
  {
    "id": "deepseek/deepseek-v3-base:free",
    "name": "DeepSeek V3 Base (free)",
    "provider": "openrouter",
    "family": "deepseek-v3",
    "created_at": "2025-03-29 00:00:00 UTC",
    "context_window": 163840,
    "max_output_tokens": 163840,
    "knowledge_cutoff": "2025-03",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 163840,
      "context": 163840
    }
  },
  {
    "id": "deepseek/deepseek-v3.1-terminus",
    "name": "DeepSeek V3.1 Terminus",
    "provider": "openrouter",
    "family": "deepseek-v3",
    "created_at": "2025-09-22 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.27,
          "output_per_million": 1,
          "reasoning_output_per_million": 1
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.27,
      "output": 65536,
      "context": 131072
    }
  },
  {
    "id": "deepseek/deepseek-v3.1-terminus:exacto",
    "name": "DeepSeek V3.1 Terminus (exacto)",
    "provider": "openrouter",
    "family": "deepseek-v3",
    "created_at": "2025-09-22 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.27,
          "output_per_million": 1,
          "reasoning_output_per_million": 1
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.27,
      "output": 65536,
      "context": 131072
    }
  },
  {
    "id": "deepseek/deepseek-v3.2",
    "name": "DeepSeek V3.2",
    "provider": "openrouter",
    "family": "deepseek-v3",
    "created_at": "2025-12-01 00:00:00 UTC",
    "context_window": 163840,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2024-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.28,
          "output_per_million": 0.4,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.28,
      "output": 65536,
      "context": 163840
    }
  },
  {
    "id": "deepseek/deepseek-v3.2-speciale",
    "name": "DeepSeek V3.2 Speciale",
    "provider": "openrouter",
    "family": "deepseek-v3",
    "created_at": "2025-12-01 00:00:00 UTC",
    "context_window": 163840,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2024-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.27,
          "output_per_million": 0.41,
          "reasoning_output_per_million": 0.41
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.27,
      "output": 65536,
      "context": 163840
    }
  },
  {
    "id": "featherless/qwerky-72b",
    "name": "Qwerky 72B",
    "provider": "openrouter",
    "family": "qwerky",
    "created_at": "2025-03-20 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 32768
    }
  },
  {
    "id": "gemini-1.5-flash",
    "name": "Gemini 1.5 Flash",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2024-05-14 00:00:00 UTC",
    "context_window": 1000000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.075,
          "output_per_million": 0.3,
          "cached_input_per_million": 0.01875,
          "reasoning_output_per_million": 0.3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.075,
      "output": 8192,
      "cache_read": 0.01875,
      "context": 1000000
    }
  },
  {
    "id": "gemini-1.5-flash-8b",
    "name": "Gemini 1.5 Flash-8B",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2024-10-03 00:00:00 UTC",
    "context_window": 1000000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.0375,
          "output_per_million": 0.15,
          "cached_input_per_million": 0.01,
          "reasoning_output_per_million": 0.15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.0375,
      "output": 8192,
      "cache_read": 0.01,
      "context": 1000000
    }
  },
  {
    "id": "gemini-1.5-pro",
    "name": "Gemini 1.5 Pro",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2024-02-15 00:00:00 UTC",
    "context_window": 1000000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 5,
          "cached_input_per_million": 0.3125,
          "reasoning_output_per_million": 5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 8192,
      "cache_read": 0.3125,
      "context": 1000000
    }
  },
  {
    "id": "gemini-2.0-flash",
    "name": "Gemini 2.0 Flash",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2024-12-11 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-06",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 8192,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.0-flash",
    "name": "Gemini 2.0 Flash",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2024-12-11 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-06",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 8192,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.0-flash-lite",
    "name": "Gemini 2.0 Flash Lite",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2024-12-11 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-06",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.075,
          "output_per_million": 0.3,
          "reasoning_output_per_million": 0.3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.075,
      "output": 8192,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.0-flash-lite",
    "name": "Gemini 2.0 Flash Lite",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2024-12-11 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-06",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.075,
          "output_per_million": 0.3,
          "reasoning_output_per_million": 0.3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.075,
      "output": 8192,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash",
    "name": "Gemini 2.5 Flash",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-03-20 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 65536,
      "cache_read": 0.075,
      "input_audio": 1,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash",
    "name": "Gemini 2.5 Flash",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-06-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 65536,
      "cache_read": 0.075,
      "cache_write": 0.383,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-image",
    "name": "Gemini 2.5 Flash Image",
    "provider": "gemini",
    "family": "gemini-flash-image",
    "created_at": "2025-08-26 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2025-06",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text",
        "image"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "image_generation"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 30,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 30
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 32768,
      "cache_read": 0.075,
      "context": 32768
    }
  },
  {
    "id": "gemini-2.5-flash-image-preview",
    "name": "Gemini 2.5 Flash Image (Preview)",
    "provider": "gemini",
    "family": "gemini-flash-image",
    "created_at": "2025-08-26 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2025-06",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text",
        "image"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "image_generation"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 30,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 30
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 32768,
      "cache_read": 0.075,
      "context": 32768
    }
  },
  {
    "id": "gemini-2.5-flash-lite",
    "name": "Gemini 2.5 Flash Lite",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2025-06-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-lite",
    "name": "Gemini 2.5 Flash Lite",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2025-06-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-lite-preview-06-17",
    "name": "Gemini 2.5 Flash Lite Preview 06-17",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2025-06-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "input_audio": 0.3,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-lite-preview-06-17",
    "name": "Gemini 2.5 Flash Lite Preview 06-17",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2025-06-17 00:00:00 UTC",
    "context_window": 65536,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 65536
    }
  },
  {
    "id": "gemini-2.5-flash-lite-preview-09-2025",
    "name": "Gemini 2.5 Flash Lite Preview 09-25",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-lite-preview-09-2025",
    "name": "Gemini 2.5 Flash Lite Preview 09-25",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-preview-04-17",
    "name": "Gemini 2.5 Flash Preview 04-17",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-04-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0.6,
          "cached_input_per_million": 0.0375,
          "reasoning_output_per_million": 0.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 65536,
      "cache_read": 0.0375,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-preview-04-17",
    "name": "Gemini 2.5 Flash Preview 04-17",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-04-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0.6,
          "cached_input_per_million": 0.0375,
          "reasoning_output_per_million": 0.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 65536,
      "cache_read": 0.0375,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-preview-05-20",
    "name": "Gemini 2.5 Flash Preview 05-20",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-05-20 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0.6,
          "cached_input_per_million": 0.0375,
          "reasoning_output_per_million": 0.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 65536,
      "cache_read": 0.0375,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-preview-05-20",
    "name": "Gemini 2.5 Flash Preview 05-20",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-05-20 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0.6,
          "cached_input_per_million": 0.0375,
          "reasoning_output_per_million": 0.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 65536,
      "cache_read": 0.0375,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-preview-09-2025",
    "name": "Gemini 2.5 Flash Preview 09-25",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 65536,
      "cache_read": 0.075,
      "input_audio": 1,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-preview-09-2025",
    "name": "Gemini 2.5 Flash Preview 09-25",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 65536,
      "cache_read": 0.075,
      "cache_write": 0.383,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-flash-preview-tts",
    "name": "Gemini 2.5 Flash Preview TTS",
    "provider": "gemini",
    "family": "gemini-flash-tts",
    "created_at": "2025-05-01 00:00:00 UTC",
    "context_window": 8000,
    "max_output_tokens": 16000,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "audio"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "speech_generation"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.5,
          "output_per_million": 10,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.5,
      "output": 16000,
      "context": 8000
    }
  },
  {
    "id": "gemini-2.5-pro",
    "name": "Gemini 2.5 Pro",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2025-03-20 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-pro",
    "name": "Gemini 2.5 Pro",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2025-03-20 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-pro-preview-05-06",
    "name": "Gemini 2.5 Pro Preview 05-06",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2025-05-06 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-pro-preview-05-06",
    "name": "Gemini 2.5 Pro Preview 05-06",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2025-05-06 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-pro-preview-06-05",
    "name": "Gemini 2.5 Pro Preview 06-05",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2025-06-05 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-pro-preview-06-05",
    "name": "Gemini 2.5 Pro Preview 06-05",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2025-06-05 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "gemini-2.5-pro-preview-tts",
    "name": "Gemini 2.5 Pro Preview TTS",
    "provider": "gemini",
    "family": "gemini-flash-tts",
    "created_at": "2025-05-01 00:00:00 UTC",
    "context_window": 8000,
    "max_output_tokens": 16000,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "audio"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "speech_generation"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1,
          "output_per_million": 20,
          "reasoning_output_per_million": 20
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1,
      "output": 16000,
      "context": 8000
    }
  },
  {
    "id": "gemini-3-flash-preview",
    "name": "Gemini 3 Flash Preview",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-12-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.5,
          "output_per_million": 3,
          "cached_input_per_million": 0.05,
          "reasoning_output_per_million": 3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.5,
      "output": 65536,
      "cache_read": 0.05,
      "context_over_200k": {
        "input": 0.5,
        "output": 3,
        "cache_read": 0.05
      },
      "context": 1048576
    }
  },
  {
    "id": "gemini-3-flash-preview",
    "name": "Gemini 3 Flash Preview",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-12-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.5,
          "output_per_million": 3,
          "cached_input_per_million": 0.05,
          "reasoning_output_per_million": 3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.5,
      "output": 65536,
      "cache_read": 0.05,
      "context_over_200k": {
        "input": 0.5,
        "output": 3,
        "cache_read": 0.05
      },
      "context": 1048576
    }
  },
  {
    "id": "gemini-3-pro-preview",
    "name": "Gemini 3 Pro Preview",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2025-11-18 00:00:00 UTC",
    "context_window": 1000000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2,
          "output_per_million": 12,
          "cached_input_per_million": 0.2,
          "reasoning_output_per_million": 12
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2,
      "output": 64000,
      "cache_read": 0.2,
      "context_over_200k": {
        "input": 4,
        "output": 18,
        "cache_read": 0.4
      },
      "context": 1000000
    }
  },
  {
    "id": "gemini-3-pro-preview",
    "name": "Gemini 3 Pro Preview",
    "provider": "gemini",
    "family": "gemini-pro",
    "created_at": "2025-11-18 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2,
          "output_per_million": 12,
          "cached_input_per_million": 0.2,
          "reasoning_output_per_million": 12
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2,
      "output": 65536,
      "cache_read": 0.2,
      "context_over_200k": {
        "input": 4,
        "output": 18,
        "cache_read": 0.4
      },
      "context": 1048576
    }
  },
  {
    "id": "gemini-embedding-001",
    "name": "Gemini Embedding 001",
    "provider": "gemini",
    "family": "gemini",
    "created_at": "2025-05-20 00:00:00 UTC",
    "context_window": 2048,
    "max_output_tokens": 3072,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 3072,
      "context": 2048
    }
  },
  {
    "id": "gemini-embedding-001",
    "name": "Gemini Embedding 001",
    "provider": "gemini",
    "family": "gemini",
    "created_at": "2025-05-20 00:00:00 UTC",
    "context_window": 2048,
    "max_output_tokens": 3072,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 3072,
      "context": 2048
    }
  },
  {
    "id": "gemini-flash-latest",
    "name": "Gemini Flash Latest",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 65536,
      "cache_read": 0.075,
      "input_audio": 1,
      "context": 1048576
    }
  },
  {
    "id": "gemini-flash-latest",
    "name": "Gemini Flash Latest",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 65536,
      "cache_read": 0.075,
      "cache_write": 0.383,
      "context": 1048576
    }
  },
  {
    "id": "gemini-flash-lite-latest",
    "name": "Gemini Flash-Lite Latest",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "gemini-flash-lite-latest",
    "name": "Gemini Flash-Lite Latest",
    "provider": "gemini",
    "family": "gemini-flash-lite",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "gemini-live-2.5-flash",
    "name": "Gemini Live 2.5 Flash",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-09-01 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 8000,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video"
      ],
      "output": [
        "text",
        "audio"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "speech_generation",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.5,
          "output_per_million": 2,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.5,
      "output": 8000,
      "input_audio": 3,
      "output_audio": 12,
      "context": 128000
    }
  },
  {
    "id": "gemini-live-2.5-flash-preview-native-audio",
    "name": "Gemini Live 2.5 Flash Preview Native Audio",
    "provider": "gemini",
    "family": "gemini-flash",
    "created_at": "2025-06-17 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "audio",
        "video"
      ],
      "output": [
        "text",
        "audio"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "transcription",
      "speech_generation",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.5,
          "output_per_million": 2,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.5,
      "output": 65536,
      "input_audio": 3,
      "output_audio": 12,
      "context": 131072
    }
  },
  {
    "id": "google/gemini-2.0-flash-001",
    "name": "Gemini 2.0 Flash",
    "provider": "openrouter",
    "family": "gemini-flash",
    "created_at": "2024-12-11 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-06",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 8192,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-2.0-flash-exp:free",
    "name": "Gemini 2.0 Flash Experimental (free)",
    "provider": "openrouter",
    "family": "gemini-flash",
    "created_at": "2024-12-11 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 1048576,
    "knowledge_cutoff": "2024-12",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 1048576,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-2.5-flash",
    "name": "Gemini 2.5 Flash",
    "provider": "openrouter",
    "family": "gemini-flash",
    "created_at": "2025-07-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.0375,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 65536,
      "cache_read": 0.0375,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-2.5-flash-lite",
    "name": "Gemini 2.5 Flash Lite",
    "provider": "openrouter",
    "family": "gemini-flash-lite",
    "created_at": "2025-06-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-2.5-flash-lite-preview-09-2025",
    "name": "Gemini 2.5 Flash Lite Preview 09-25",
    "provider": "openrouter",
    "family": "gemini-flash-lite",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 65536,
      "cache_read": 0.025,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-2.5-flash-preview-09-2025",
    "name": "Gemini 2.5 Flash Preview 09-25",
    "provider": "openrouter",
    "family": "gemini-flash",
    "created_at": "2025-09-25 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.031,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 65536,
      "cache_read": 0.031,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-2.5-pro",
    "name": "Gemini 2.5 Pro",
    "provider": "openrouter",
    "family": "gemini-pro",
    "created_at": "2025-03-20 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-2.5-pro-preview-05-06",
    "name": "Gemini 2.5 Pro Preview 05-06",
    "provider": "openrouter",
    "family": "gemini-pro",
    "created_at": "2025-05-06 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-2.5-pro-preview-06-05",
    "name": "Gemini 2.5 Pro Preview 06-05",
    "provider": "openrouter",
    "family": "gemini-pro",
    "created_at": "2025-06-05 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.31,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 65536,
      "cache_read": 0.31,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-3-flash-preview",
    "name": "Gemini 3 Flash Preview",
    "provider": "openrouter",
    "family": "gemini-flash",
    "created_at": "2025-12-17 00:00:00 UTC",
    "context_window": 1048576,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.5,
          "output_per_million": 3,
          "cached_input_per_million": 0.05,
          "reasoning_output_per_million": 3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.5,
      "output": 65536,
      "cache_read": 0.05,
      "context": 1048576
    }
  },
  {
    "id": "google/gemini-3-pro-preview",
    "name": "Gemini 3 Pro Preview",
    "provider": "openrouter",
    "family": "gemini-pro",
    "created_at": "2025-11-18 00:00:00 UTC",
    "context_window": 1050000,
    "max_output_tokens": 66000,
    "knowledge_cutoff": "2025-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2,
          "output_per_million": 12,
          "reasoning_output_per_million": 12
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2,
      "output": 66000,
      "context": 1050000
    }
  },
  {
    "id": "google/gemma-2-9b-it:free",
    "name": "Gemma 2 9B (free)",
    "provider": "openrouter",
    "family": "gemma-2",
    "created_at": "2024-06-28 00:00:00 UTC",
    "context_window": 8192,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-06",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 8192
    }
  },
  {
    "id": "google/gemma-3-12b-it",
    "name": "Gemma 3 12B IT",
    "provider": "openrouter",
    "family": "gemma-3",
    "created_at": "2025-03-13 00:00:00 UTC",
    "context_window": 96000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 96000
    }
  },
  {
    "id": "google/gemma-3-27b-it",
    "name": "Gemma 3 27B IT",
    "provider": "openrouter",
    "family": "gemma-3",
    "created_at": "2025-03-12 00:00:00 UTC",
    "context_window": 96000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 96000
    }
  },
  {
    "id": "google/gemma-3n-e4b-it",
    "name": "Gemma 3n E4B IT",
    "provider": "openrouter",
    "family": "gemma-3",
    "created_at": "2025-05-20 00:00:00 UTC",
    "context_window": 8192,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 8192
    }
  },
  {
    "id": "google/gemma-3n-e4b-it:free",
    "name": "Gemma 3n 4B (free)",
    "provider": "openrouter",
    "family": "gemma-3",
    "created_at": "2025-05-20 00:00:00 UTC",
    "context_window": 8192,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text",
        "image",
        "audio"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "transcription",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 8192
    }
  },
  {
    "id": "gpt-3.5-turbo",
    "name": "GPT-3.5-turbo",
    "provider": "openai",
    "family": "gpt-3.5-turbo",
    "created_at": "2023-03-01 00:00:00 UTC",
    "context_window": 16385,
    "max_output_tokens": 4096,
    "knowledge_cutoff": "2021-09-01",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.5,
          "output_per_million": 1.5,
          "cached_input_per_million": 1.25,
          "reasoning_output_per_million": 1.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.5,
      "output": 4096,
      "cache_read": 1.25,
      "context": 16385
    }
  },
  {
    "id": "gpt-4",
    "name": "GPT-4",
    "provider": "openai",
    "family": "gpt-4",
    "created_at": "2023-11-06 00:00:00 UTC",
    "context_window": 8192,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2023-11",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 30,
          "output_per_million": 60,
          "reasoning_output_per_million": 60
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 30,
      "output": 8192,
      "context": 8192
    }
  },
  {
    "id": "gpt-4-turbo",
    "name": "GPT-4 Turbo",
    "provider": "openai",
    "family": "gpt-4-turbo",
    "created_at": "2023-11-06 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 4096,
    "knowledge_cutoff": "2023-12",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 10,
          "output_per_million": 30,
          "reasoning_output_per_million": 30
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 10,
      "output": 4096,
      "context": 128000
    }
  },
  {
    "id": "gpt-4.1",
    "name": "GPT-4.1",
    "provider": "openai",
    "family": "gpt-4.1",
    "created_at": "2025-04-14 00:00:00 UTC",
    "context_window": 1047576,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2,
          "output_per_million": 8,
          "cached_input_per_million": 0.5,
          "reasoning_output_per_million": 8
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2,
      "output": 32768,
      "cache_read": 0.5,
      "context": 1047576
    }
  },
  {
    "id": "gpt-4.1-mini",
    "name": "GPT-4.1 mini",
    "provider": "openai",
    "family": "gpt-4.1-mini",
    "created_at": "2025-04-14 00:00:00 UTC",
    "context_window": 1047576,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.4,
          "output_per_million": 1.6,
          "cached_input_per_million": 0.1,
          "reasoning_output_per_million": 1.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.4,
      "output": 32768,
      "cache_read": 0.1,
      "context": 1047576
    }
  },
  {
    "id": "gpt-4.1-nano",
    "name": "GPT-4.1 nano",
    "provider": "openai",
    "family": "gpt-4.1-nano",
    "created_at": "2025-04-14 00:00:00 UTC",
    "context_window": 1047576,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.03,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 32768,
      "cache_read": 0.03,
      "context": 1047576
    }
  },
  {
    "id": "gpt-4o",
    "name": "GPT-4o",
    "provider": "openai",
    "family": "gpt-4o",
    "created_at": "2024-05-13 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2.5,
          "output_per_million": 10,
          "cached_input_per_million": 1.25,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2.5,
      "output": 16384,
      "cache_read": 1.25,
      "context": 128000
    }
  },
  {
    "id": "gpt-4o-2024-05-13",
    "name": "GPT-4o (2024-05-13)",
    "provider": "openai",
    "family": "gpt-4o",
    "created_at": "2024-05-13 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 4096,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 5,
          "output_per_million": 15,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 5,
      "output": 4096,
      "context": 128000
    }
  },
  {
    "id": "gpt-4o-2024-08-06",
    "name": "GPT-4o (2024-08-06)",
    "provider": "openai",
    "family": "gpt-4o",
    "created_at": "2024-08-06 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2.5,
          "output_per_million": 10,
          "cached_input_per_million": 1.25,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2.5,
      "output": 16384,
      "cache_read": 1.25,
      "context": 128000
    }
  },
  {
    "id": "gpt-4o-2024-11-20",
    "name": "GPT-4o (2024-11-20)",
    "provider": "openai",
    "family": "gpt-4o",
    "created_at": "2024-11-20 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2.5,
          "output_per_million": 10,
          "cached_input_per_million": 1.25,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2.5,
      "output": 16384,
      "cache_read": 1.25,
      "context": 128000
    }
  },
  {
    "id": "gpt-4o-mini",
    "name": "GPT-4o mini",
    "provider": "openai",
    "family": "gpt-4o-mini",
    "created_at": "2024-07-18 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0.6,
          "cached_input_per_million": 0.08,
          "reasoning_output_per_million": 0.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 16384,
      "cache_read": 0.08,
      "context": 128000
    }
  },
  {
    "id": "gpt-5",
    "name": "GPT-5",
    "provider": "openai",
    "family": "gpt-5",
    "created_at": "2025-08-07 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.13,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "cache_read": 0.13,
      "context": 400000
    }
  },
  {
    "id": "gpt-5-chat-latest",
    "name": "GPT-5 Chat (latest)",
    "provider": "openai",
    "family": "gpt-5-chat",
    "created_at": "2025-08-07 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "context": 400000
    }
  },
  {
    "id": "gpt-5-codex",
    "name": "GPT-5-Codex",
    "provider": "openai",
    "family": "gpt-5-codex",
    "created_at": "2025-09-15 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.125,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "cache_read": 0.125,
      "context": 400000
    }
  },
  {
    "id": "gpt-5-mini",
    "name": "GPT-5 Mini",
    "provider": "openai",
    "family": "gpt-5-mini",
    "created_at": "2025-08-07 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-05-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.25,
          "output_per_million": 2,
          "cached_input_per_million": 0.03,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.25,
      "output": 128000,
      "cache_read": 0.03,
      "context": 400000
    }
  },
  {
    "id": "gpt-5-nano",
    "name": "GPT-5 Nano",
    "provider": "openai",
    "family": "gpt-5-nano",
    "created_at": "2025-08-07 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-05-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.05,
          "output_per_million": 0.4,
          "cached_input_per_million": 0.01,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.05,
      "output": 128000,
      "cache_read": 0.01,
      "context": 400000
    }
  },
  {
    "id": "gpt-5-pro",
    "name": "GPT-5 Pro",
    "provider": "openai",
    "family": "gpt-5-pro",
    "created_at": "2025-10-06 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 272000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 120,
          "reasoning_output_per_million": 120
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 272000,
      "context": 400000
    }
  },
  {
    "id": "gpt-5.1",
    "name": "GPT-5.1",
    "provider": "openai",
    "family": "gpt-5",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.13,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "cache_read": 0.13,
      "context": 400000
    }
  },
  {
    "id": "gpt-5.1-chat-latest",
    "name": "GPT-5.1 Chat",
    "provider": "openai",
    "family": "gpt-5-chat",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.125,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 16384,
      "cache_read": 0.125,
      "context": 128000
    }
  },
  {
    "id": "gpt-5.1-codex",
    "name": "GPT-5.1 Codex",
    "provider": "openai",
    "family": "gpt-5-codex",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.125,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "cache_read": 0.125,
      "context": 400000
    }
  },
  {
    "id": "gpt-5.1-codex-max",
    "name": "GPT-5.1 Codex Max",
    "provider": "openai",
    "family": "gpt-5-codex",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.125,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "cache_read": 0.125,
      "context": 400000
    }
  },
  {
    "id": "gpt-5.1-codex-mini",
    "name": "GPT-5.1 Codex mini",
    "provider": "openai",
    "family": "gpt-5-codex-mini",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.25,
          "output_per_million": 2,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.25,
      "output": 128000,
      "cache_read": 0.025,
      "context": 400000
    }
  },
  {
    "id": "gpt-5.2",
    "name": "GPT-5.2",
    "provider": "openai",
    "family": "gpt-5",
    "created_at": "2025-12-11 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2025-08-31",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.75,
          "output_per_million": 14,
          "cached_input_per_million": 0.175,
          "reasoning_output_per_million": 14
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.75,
      "output": 128000,
      "cache_read": 0.175,
      "context": 400000
    }
  },
  {
    "id": "gpt-5.2-chat-latest",
    "name": "GPT-5.2 Chat",
    "provider": "openai",
    "family": "gpt-5-chat",
    "created_at": "2025-12-11 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2025-08-31",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.75,
          "output_per_million": 14,
          "cached_input_per_million": 0.175,
          "reasoning_output_per_million": 14
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.75,
      "output": 16384,
      "cache_read": 0.175,
      "context": 128000
    }
  },
  {
    "id": "gpt-5.2-pro",
    "name": "GPT-5.2 Pro",
    "provider": "openai",
    "family": "gpt-5-pro",
    "created_at": "2025-12-11 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2025-08-31",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 21,
          "output_per_million": 168,
          "reasoning_output_per_million": 168
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 21,
      "output": 128000,
      "context": 400000
    }
  },
  {
    "id": "kwaipilot/kat-coder-pro:free",
    "name": "Kat Coder Pro (free)",
    "provider": "openrouter",
    "family": "kat-coder-pro",
    "created_at": "2025-11-10 00:00:00 UTC",
    "context_window": 256000,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-11",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 65536,
      "context": 256000
    }
  },
  {
    "id": "meta-llama/llama-3.2-11b-vision-instruct",
    "name": "Llama 3.2 11B Vision Instruct",
    "provider": "openrouter",
    "family": "llama-3.2",
    "created_at": "2024-09-25 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2023-12",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 131072
    }
  },
  {
    "id": "meta-llama/llama-3.3-70b-instruct:free",
    "name": "Llama 3.3 70B Instruct (free)",
    "provider": "openrouter",
    "family": "llama-3.3",
    "created_at": "2024-12-06 00:00:00 UTC",
    "context_window": 65536,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2024-12",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 65536,
      "context": 65536
    }
  },
  {
    "id": "meta-llama/llama-4-scout:free",
    "name": "Llama 4 Scout (free)",
    "provider": "openrouter",
    "family": "llama-4-scout",
    "created_at": "2025-04-05 00:00:00 UTC",
    "context_window": 64000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2024-08",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 64000,
      "context": 64000
    }
  },
  {
    "id": "microsoft/mai-ds-r1:free",
    "name": "MAI DS R1 (free)",
    "provider": "openrouter",
    "family": "mai-ds-r1",
    "created_at": "2025-04-21 00:00:00 UTC",
    "context_window": 163840,
    "max_output_tokens": 163840,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 163840,
      "context": 163840
    }
  },
  {
    "id": "minimax/minimax-01",
    "name": "MiniMax-01",
    "provider": "openrouter",
    "family": "minimax",
    "created_at": "2025-01-15 00:00:00 UTC",
    "context_window": 1000000,
    "max_output_tokens": 1000000,
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.2,
          "output_per_million": 1.1,
          "reasoning_output_per_million": 1.1
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.2,
      "output": 1000000,
      "context": 1000000
    }
  },
  {
    "id": "minimax/minimax-m1",
    "name": "MiniMax M1",
    "provider": "openrouter",
    "family": "minimax",
    "created_at": "2025-06-17 00:00:00 UTC",
    "context_window": 1000000,
    "max_output_tokens": 40000,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.4,
          "output_per_million": 2.2,
          "reasoning_output_per_million": 2.2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.4,
      "output": 40000,
      "context": 1000000
    }
  },
  {
    "id": "minimax/minimax-m2",
    "name": "MiniMax M2",
    "provider": "openrouter",
    "family": "minimax",
    "created_at": "2025-10-23 00:00:00 UTC",
    "context_window": 196600,
    "max_output_tokens": 118000,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.28,
          "output_per_million": 1.15,
          "cached_input_per_million": 0.28,
          "reasoning_output_per_million": 1.15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.28,
      "output": 118000,
      "cache_read": 0.28,
      "cache_write": 1.15,
      "context": 196600
    }
  },
  {
    "id": "minimax/minimax-m2.1",
    "name": "MiniMax M2.1",
    "provider": "openrouter",
    "family": "minimax",
    "created_at": "2025-12-23 00:00:00 UTC",
    "context_window": 204800,
    "max_output_tokens": 131072,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 1.2,
          "reasoning_output_per_million": 1.2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 131072,
      "context": 204800
    }
  },
  {
    "id": "mistralai/codestral-2508",
    "name": "Codestral 2508",
    "provider": "openrouter",
    "family": "codestral",
    "created_at": "2025-08-01 00:00:00 UTC",
    "context_window": 256000,
    "max_output_tokens": 256000,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 0.9,
          "reasoning_output_per_million": 0.9
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 256000,
      "context": 256000
    }
  },
  {
    "id": "mistralai/devstral-2512",
    "name": "Devstral 2 2512",
    "provider": "openrouter",
    "family": "devstral",
    "created_at": "2025-09-12 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 262144,
    "knowledge_cutoff": "2025-12",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0.6,
          "reasoning_output_per_million": 0.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 262144,
      "context": 262144
    }
  },
  {
    "id": "mistralai/devstral-2512:free",
    "name": "Devstral 2 2512 (free)",
    "provider": "openrouter",
    "family": "devstral",
    "created_at": "2025-09-12 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 262144,
    "knowledge_cutoff": "2025-12",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 262144,
      "context": 262144
    }
  },
  {
    "id": "mistralai/devstral-medium-2507",
    "name": "Devstral Medium",
    "provider": "openrouter",
    "family": "devstral-medium",
    "created_at": "2025-07-10 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.4,
          "output_per_million": 2,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.4,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "mistralai/devstral-small-2505",
    "name": "Devstral Small",
    "provider": "openrouter",
    "family": "devstral-small",
    "created_at": "2025-05-07 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.06,
          "output_per_million": 0.12,
          "reasoning_output_per_million": 0.12
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.06,
      "output": 128000,
      "context": 128000
    }
  },
  {
    "id": "mistralai/devstral-small-2505:free",
    "name": "Devstral Small 2505 (free)",
    "provider": "openrouter",
    "family": "devstral-small",
    "created_at": "2025-05-21 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 32768,
      "context": 32768
    }
  },
  {
    "id": "mistralai/devstral-small-2507",
    "name": "Devstral Small 1.1",
    "provider": "openrouter",
    "family": "devstral-small",
    "created_at": "2025-07-10 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0.3,
          "reasoning_output_per_million": 0.3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "mistralai/mistral-7b-instruct:free",
    "name": "Mistral 7B Instruct (free)",
    "provider": "openrouter",
    "family": "mistral-7b",
    "created_at": "2024-05-27 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2024-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 32768,
      "context": 32768
    }
  },
  {
    "id": "mistralai/mistral-medium-3",
    "name": "Mistral Medium 3",
    "provider": "openrouter",
    "family": "mistral-medium",
    "created_at": "2025-05-07 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.4,
          "output_per_million": 2,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.4,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "mistralai/mistral-medium-3.1",
    "name": "Mistral Medium 3.1",
    "provider": "openrouter",
    "family": "mistral-medium",
    "created_at": "2025-08-12 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 262144,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.4,
          "output_per_million": 2,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.4,
      "output": 262144,
      "context": 262144
    }
  },
  {
    "id": "mistralai/mistral-nemo:free",
    "name": "Mistral Nemo (free)",
    "provider": "openrouter",
    "family": "mistral-nemo",
    "created_at": "2024-07-19 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2024-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "mistralai/mistral-small-3.1-24b-instruct",
    "name": "Mistral Small 3.1 24B Instruct",
    "provider": "openrouter",
    "family": "mistral-small",
    "created_at": "2025-03-17 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 128000
    }
  },
  {
    "id": "mistralai/mistral-small-3.2-24b-instruct",
    "name": "Mistral Small 3.2 24B Instruct",
    "provider": "openrouter",
    "family": "mistral-small",
    "created_at": "2025-06-20 00:00:00 UTC",
    "context_window": 96000,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 96000
    }
  },
  {
    "id": "mistralai/mistral-small-3.2-24b-instruct:free",
    "name": "Mistral Small 3.2 24B (free)",
    "provider": "openrouter",
    "family": "mistral-small",
    "created_at": "2025-06-20 00:00:00 UTC",
    "context_window": 96000,
    "max_output_tokens": 96000,
    "knowledge_cutoff": "2025-06",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 96000,
      "context": 96000
    }
  },
  {
    "id": "moonshotai/kimi-dev-72b:free",
    "name": "Kimi Dev 72b (free)",
    "provider": "openrouter",
    "family": "kimi",
    "created_at": "2025-06-16 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-06",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "moonshotai/kimi-k2",
    "name": "Kimi K2",
    "provider": "openrouter",
    "family": "kimi-k2",
    "created_at": "2025-07-11 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.55,
          "output_per_million": 2.2,
          "reasoning_output_per_million": 2.2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.55,
      "output": 32768,
      "context": 131072
    }
  },
  {
    "id": "moonshotai/kimi-k2-0905",
    "name": "Kimi K2 Instruct 0905",
    "provider": "openrouter",
    "family": "kimi-k2",
    "created_at": "2025-09-05 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.6,
          "output_per_million": 2.5,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.6,
      "output": 16384,
      "context": 262144
    }
  },
  {
    "id": "moonshotai/kimi-k2-0905:exacto",
    "name": "Kimi K2 Instruct 0905 (exacto)",
    "provider": "openrouter",
    "family": "kimi-k2",
    "created_at": "2025-09-05 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.6,
          "output_per_million": 2.5,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.6,
      "output": 16384,
      "context": 262144
    }
  },
  {
    "id": "moonshotai/kimi-k2-thinking",
    "name": "Kimi K2 Thinking",
    "provider": "openrouter",
    "family": "kimi-k2",
    "created_at": "2025-11-06 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 262144,
    "knowledge_cutoff": "2024-08",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.6,
          "output_per_million": 2.5,
          "cached_input_per_million": 0.15,
          "reasoning_output_per_million": 2.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.6,
      "output": 262144,
      "cache_read": 0.15,
      "context": 262144
    }
  },
  {
    "id": "moonshotai/kimi-k2:free",
    "name": "Kimi K2 (free)",
    "provider": "openrouter",
    "family": "kimi-k2",
    "created_at": "2025-07-11 00:00:00 UTC",
    "context_window": 32800,
    "max_output_tokens": 32800,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 32800,
      "context": 32800
    }
  },
  {
    "id": "nousresearch/deephermes-3-llama-3-8b-preview",
    "name": "DeepHermes 3 Llama 3 8B Preview",
    "provider": "openrouter",
    "family": "llama-3",
    "created_at": "2025-02-28 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 131072
    }
  },
  {
    "id": "nousresearch/hermes-4-405b",
    "name": "Hermes 4 405B",
    "provider": "openrouter",
    "family": "hermes",
    "created_at": "2025-08-25 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2023-12",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1,
          "output_per_million": 3,
          "reasoning_output_per_million": 3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "nousresearch/hermes-4-70b",
    "name": "Hermes 4 70B",
    "provider": "openrouter",
    "family": "hermes",
    "created_at": "2025-08-25 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2023-12",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.13,
          "output_per_million": 0.4,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.13,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "nvidia/nemotron-nano-9b-v2",
    "name": "nvidia-nemotron-nano-9b-v2",
    "provider": "openrouter",
    "family": "nemotron",
    "created_at": "2025-08-18 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2024-09",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.04,
          "output_per_million": 0.16,
          "reasoning_output_per_million": 0.16
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.04,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "o1",
    "name": "o1",
    "provider": "openai",
    "family": "o1",
    "created_at": "2024-12-05 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 60,
          "cached_input_per_million": 7.5,
          "reasoning_output_per_million": 60
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 100000,
      "cache_read": 7.5,
      "context": 200000
    }
  },
  {
    "id": "o1-mini",
    "name": "o1-mini",
    "provider": "openai",
    "family": "o1-mini",
    "created_at": "2024-09-12 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.1,
          "output_per_million": 4.4,
          "cached_input_per_million": 0.55,
          "reasoning_output_per_million": 4.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.1,
      "output": 65536,
      "cache_read": 0.55,
      "context": 128000
    }
  },
  {
    "id": "o1-preview",
    "name": "o1-preview",
    "provider": "openai",
    "family": "o1-preview",
    "created_at": "2024-09-12 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 60,
          "cached_input_per_million": 7.5,
          "reasoning_output_per_million": 60
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 32768,
      "cache_read": 7.5,
      "context": 128000
    }
  },
  {
    "id": "o1-pro",
    "name": "o1-pro",
    "provider": "openai",
    "family": "o1-pro",
    "created_at": "2025-03-19 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2023-09",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 150,
          "output_per_million": 600,
          "reasoning_output_per_million": 600
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 150,
      "output": 100000,
      "context": 200000
    }
  },
  {
    "id": "o3",
    "name": "o3",
    "provider": "openai",
    "family": "o3",
    "created_at": "2025-04-16 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-05",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2,
          "output_per_million": 8,
          "cached_input_per_million": 0.5,
          "reasoning_output_per_million": 8
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2,
      "output": 100000,
      "cache_read": 0.5,
      "context": 200000
    }
  },
  {
    "id": "o3-deep-research",
    "name": "o3-deep-research",
    "provider": "openai",
    "family": "o3",
    "created_at": "2024-06-26 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-05",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 10,
          "output_per_million": 40,
          "cached_input_per_million": 2.5,
          "reasoning_output_per_million": 40
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 10,
      "output": 100000,
      "cache_read": 2.5,
      "context": 200000
    }
  },
  {
    "id": "o3-mini",
    "name": "o3-mini",
    "provider": "openai",
    "family": "o3-mini",
    "created_at": "2024-12-20 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.1,
          "output_per_million": 4.4,
          "cached_input_per_million": 0.55,
          "reasoning_output_per_million": 4.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.1,
      "output": 100000,
      "cache_read": 0.55,
      "context": 200000
    }
  },
  {
    "id": "o3-pro",
    "name": "o3-pro",
    "provider": "openai",
    "family": "o3-pro",
    "created_at": "2025-06-10 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-05",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 20,
          "output_per_million": 80,
          "reasoning_output_per_million": 80
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 20,
      "output": 100000,
      "context": 200000
    }
  },
  {
    "id": "o4-mini",
    "name": "o4-mini",
    "provider": "openai",
    "family": "o4-mini",
    "created_at": "2025-04-16 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-05",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.1,
          "output_per_million": 4.4,
          "cached_input_per_million": 0.28,
          "reasoning_output_per_million": 4.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.1,
      "output": 100000,
      "cache_read": 0.28,
      "context": 200000
    }
  },
  {
    "id": "o4-mini-deep-research",
    "name": "o4-mini-deep-research",
    "provider": "openai",
    "family": "o4-mini",
    "created_at": "2024-06-26 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-05",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2,
          "output_per_million": 8,
          "cached_input_per_million": 0.5,
          "reasoning_output_per_million": 8
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2,
      "output": 100000,
      "cache_read": 0.5,
      "context": 200000
    }
  },
  {
    "id": "openai/gpt-4.1",
    "name": "GPT-4.1",
    "provider": "openrouter",
    "family": "gpt-4.1",
    "created_at": "2025-04-14 00:00:00 UTC",
    "context_window": 1047576,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 2,
          "output_per_million": 8,
          "cached_input_per_million": 0.5,
          "reasoning_output_per_million": 8
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 2,
      "output": 32768,
      "cache_read": 0.5,
      "context": 1047576
    }
  },
  {
    "id": "openai/gpt-4.1-mini",
    "name": "GPT-4.1 Mini",
    "provider": "openrouter",
    "family": "gpt-4.1-mini",
    "created_at": "2025-04-14 00:00:00 UTC",
    "context_window": 1047576,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2024-04",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.4,
          "output_per_million": 1.6,
          "cached_input_per_million": 0.1,
          "reasoning_output_per_million": 1.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.4,
      "output": 32768,
      "cache_read": 0.1,
      "context": 1047576
    }
  },
  {
    "id": "openai/gpt-4o-mini",
    "name": "GPT-4o-mini",
    "provider": "openrouter",
    "family": "gpt-4o-mini",
    "created_at": "2024-07-18 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0.6,
          "cached_input_per_million": 0.08,
          "reasoning_output_per_million": 0.6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 16384,
      "cache_read": 0.08,
      "context": 128000
    }
  },
  {
    "id": "openai/gpt-5",
    "name": "GPT-5",
    "provider": "openrouter",
    "family": "gpt-5",
    "created_at": "2025-08-07 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-10-01",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5-chat",
    "name": "GPT-5 Chat (latest)",
    "provider": "openrouter",
    "family": "gpt-5-chat",
    "created_at": "2025-08-07 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5-codex",
    "name": "GPT-5 Codex",
    "provider": "openrouter",
    "family": "gpt-5-codex",
    "created_at": "2025-09-15 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-10-01",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.125,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "cache_read": 0.125,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5-image",
    "name": "GPT-5 Image",
    "provider": "openrouter",
    "family": "gpt-5",
    "created_at": "2025-10-14 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-10-01",
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text",
        "image"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "image_generation",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 5,
          "output_per_million": 10,
          "cached_input_per_million": 1.25,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 5,
      "output": 128000,
      "cache_read": 1.25,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5-mini",
    "name": "GPT-5 Mini",
    "provider": "openrouter",
    "family": "gpt-5-mini",
    "created_at": "2025-08-07 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-10-01",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.25,
          "output_per_million": 2,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.25,
      "output": 128000,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5-nano",
    "name": "GPT-5 Nano",
    "provider": "openrouter",
    "family": "gpt-5-nano",
    "created_at": "2025-08-07 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-10-01",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.05,
          "output_per_million": 0.4,
          "reasoning_output_per_million": 0.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.05,
      "output": 128000,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5-pro",
    "name": "GPT-5 Pro",
    "provider": "openrouter",
    "family": "gpt-5-pro",
    "created_at": "2025-10-06 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 272000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 15,
          "output_per_million": 120,
          "reasoning_output_per_million": 120
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 15,
      "output": 272000,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5.1",
    "name": "GPT-5.1",
    "provider": "openrouter",
    "family": "gpt-5",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.125,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "cache_read": 0.125,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5.1-chat",
    "name": "GPT-5.1 Chat",
    "provider": "openrouter",
    "family": "gpt-5-chat",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.125,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 16384,
      "cache_read": 0.125,
      "context": 128000
    }
  },
  {
    "id": "openai/gpt-5.1-codex",
    "name": "GPT-5.1-Codex",
    "provider": "openrouter",
    "family": "gpt-5-codex",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.25,
          "output_per_million": 10,
          "cached_input_per_million": 0.125,
          "reasoning_output_per_million": 10
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.25,
      "output": 128000,
      "cache_read": 0.125,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5.1-codex-mini",
    "name": "GPT-5.1-Codex-Mini",
    "provider": "openrouter",
    "family": "gpt-5-codex-mini",
    "created_at": "2025-11-13 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-09-30",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.25,
          "output_per_million": 2,
          "cached_input_per_million": 0.025,
          "reasoning_output_per_million": 2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.25,
      "output": 100000,
      "cache_read": 0.025,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5.2",
    "name": "GPT-5.2",
    "provider": "openrouter",
    "family": "gpt-5",
    "created_at": "2025-12-11 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2025-08-31",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.75,
          "output_per_million": 14,
          "cached_input_per_million": 0.175,
          "reasoning_output_per_million": 14
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.75,
      "output": 128000,
      "cache_read": 0.175,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-5.2-chat-latest",
    "name": "GPT-5.2 Chat",
    "provider": "openrouter",
    "family": "gpt-5-chat",
    "created_at": "2025-12-11 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2025-08-31",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.75,
          "output_per_million": 14,
          "cached_input_per_million": 0.175,
          "reasoning_output_per_million": 14
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.75,
      "output": 16384,
      "cache_read": 0.175,
      "context": 128000
    }
  },
  {
    "id": "openai/gpt-5.2-pro",
    "name": "GPT-5.2 Pro",
    "provider": "openrouter",
    "family": "gpt-5-pro",
    "created_at": "2025-12-11 00:00:00 UTC",
    "context_window": 400000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2025-08-31",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 21,
          "output_per_million": 168,
          "reasoning_output_per_million": 168
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 21,
      "output": 128000,
      "context": 400000
    }
  },
  {
    "id": "openai/gpt-oss-120b",
    "name": "GPT OSS 120B",
    "provider": "openrouter",
    "family": "gpt-oss",
    "created_at": "2025-08-05 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 32768,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.072,
          "output_per_million": 0.28,
          "reasoning_output_per_million": 0.28
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.072,
      "output": 32768,
      "context": 131072
    }
  },
  {
    "id": "openai/gpt-oss-120b-maas",
    "name": "GPT OSS 120B",
    "provider": "gemini",
    "family": "gpt-oss",
    "created_at": "2025-08-05 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 32768,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.09,
          "output_per_million": 0.36,
          "reasoning_output_per_million": 0.36
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.09,
      "output": 32768,
      "context": 131072
    }
  },
  {
    "id": "openai/gpt-oss-120b:exacto",
    "name": "GPT OSS 120B (exacto)",
    "provider": "openrouter",
    "family": "gpt-oss",
    "created_at": "2025-08-05 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 32768,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.05,
          "output_per_million": 0.24,
          "reasoning_output_per_million": 0.24
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.05,
      "output": 32768,
      "context": 131072
    }
  },
  {
    "id": "openai/gpt-oss-20b",
    "name": "GPT OSS 20B",
    "provider": "openrouter",
    "family": "gpt-oss",
    "created_at": "2025-08-05 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 32768,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.05,
          "output_per_million": 0.2,
          "reasoning_output_per_million": 0.2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.05,
      "output": 32768,
      "context": 131072
    }
  },
  {
    "id": "openai/gpt-oss-20b-maas",
    "name": "GPT OSS 20B",
    "provider": "gemini",
    "family": "gpt-oss",
    "created_at": "2025-08-05 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 32768,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.07,
          "output_per_million": 0.25,
          "reasoning_output_per_million": 0.25
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.07,
      "output": 32768,
      "context": 131072
    }
  },
  {
    "id": "openai/gpt-oss-safeguard-20b",
    "name": "GPT OSS Safeguard 20B",
    "provider": "openrouter",
    "family": "gpt-oss",
    "created_at": "2025-10-29 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 65536,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.075,
          "output_per_million": 0.3,
          "reasoning_output_per_million": 0.3
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.075,
      "output": 65536,
      "context": 131072
    }
  },
  {
    "id": "openai/o4-mini",
    "name": "o4 Mini",
    "provider": "openrouter",
    "family": "o4-mini",
    "created_at": "2025-04-16 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 100000,
    "knowledge_cutoff": "2024-06",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.1,
          "output_per_million": 4.4,
          "cached_input_per_million": 0.28,
          "reasoning_output_per_million": 4.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.1,
      "output": 100000,
      "cache_read": 0.28,
      "context": 200000
    }
  },
  {
    "id": "openrouter/sherlock-dash-alpha",
    "name": "Sherlock Dash Alpha",
    "provider": "openrouter",
    "family": "sherlock",
    "created_at": "2025-11-15 00:00:00 UTC",
    "context_window": 1840000,
    "max_output_tokens": 0,
    "knowledge_cutoff": "2025-11",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 0,
      "context": 1840000
    }
  },
  {
    "id": "openrouter/sherlock-think-alpha",
    "name": "Sherlock Think Alpha",
    "provider": "openrouter",
    "family": "sherlock",
    "created_at": "2025-11-15 00:00:00 UTC",
    "context_window": 1840000,
    "max_output_tokens": 0,
    "knowledge_cutoff": "2025-11",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 0,
      "context": 1840000
    }
  },
  {
    "id": "qwen/qwen-2.5-coder-32b-instruct",
    "name": "Qwen2.5 Coder 32B Instruct",
    "provider": "openrouter",
    "family": "qwen",
    "created_at": "2024-11-11 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 32768
    }
  },
  {
    "id": "qwen/qwen2.5-vl-32b-instruct:free",
    "name": "Qwen2.5 VL 32B Instruct (free)",
    "provider": "openrouter",
    "family": "qwen2.5-vl",
    "created_at": "2025-03-24 00:00:00 UTC",
    "context_window": 8192,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2025-03",
    "modalities": {
      "input": [
        "text",
        "image",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 8192
    }
  },
  {
    "id": "qwen/qwen2.5-vl-72b-instruct",
    "name": "Qwen2.5 VL 72B Instruct",
    "provider": "openrouter",
    "family": "qwen2.5-vl",
    "created_at": "2025-02-01 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 32768
    }
  },
  {
    "id": "qwen/qwen2.5-vl-72b-instruct:free",
    "name": "Qwen2.5 VL 72B Instruct (free)",
    "provider": "openrouter",
    "family": "qwen2.5-vl",
    "created_at": "2025-02-01 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2025-02",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 32768,
      "context": 32768
    }
  },
  {
    "id": "qwen/qwen3-14b:free",
    "name": "Qwen3 14B (free)",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-04-28 00:00:00 UTC",
    "context_window": 40960,
    "max_output_tokens": 40960,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 40960,
      "context": 40960
    }
  },
  {
    "id": "qwen/qwen3-235b-a22b-07-25",
    "name": "Qwen3 235B A22B Instruct 2507",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-04-28 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.15,
          "output_per_million": 0.85,
          "reasoning_output_per_million": 0.85
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.15,
      "output": 131072,
      "context": 262144
    }
  },
  {
    "id": "qwen/qwen3-235b-a22b-07-25:free",
    "name": "Qwen3 235B A22B Instruct 2507 (free)",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-04-28 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 131072,
      "context": 262144
    }
  },
  {
    "id": "qwen/qwen3-235b-a22b-thinking-2507",
    "name": "Qwen3 235B A22B Thinking 2507",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-07-25 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 81920,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.078,
          "output_per_million": 0.312,
          "reasoning_output_per_million": 0.312
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.078,
      "output": 81920,
      "context": 262144
    }
  },
  {
    "id": "qwen/qwen3-235b-a22b:free",
    "name": "Qwen3 235B A22B (free)",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-04-28 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 131072,
      "context": 131072
    }
  },
  {
    "id": "qwen/qwen3-30b-a3b-instruct-2507",
    "name": "Qwen3 30B A3B Instruct 2507",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-07-29 00:00:00 UTC",
    "context_window": 262000,
    "max_output_tokens": 262000,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.2,
          "output_per_million": 0.8,
          "reasoning_output_per_million": 0.8
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.2,
      "output": 262000,
      "context": 262000
    }
  },
  {
    "id": "qwen/qwen3-30b-a3b-thinking-2507",
    "name": "Qwen3 30B A3B Thinking 2507",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-07-29 00:00:00 UTC",
    "context_window": 262000,
    "max_output_tokens": 262000,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.2,
          "output_per_million": 0.8,
          "reasoning_output_per_million": 0.8
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.2,
      "output": 262000,
      "context": 262000
    }
  },
  {
    "id": "qwen/qwen3-30b-a3b:free",
    "name": "Qwen3 30B A3B (free)",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-04-28 00:00:00 UTC",
    "context_window": 40960,
    "max_output_tokens": 40960,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 40960,
      "context": 40960
    }
  },
  {
    "id": "qwen/qwen3-32b:free",
    "name": "Qwen3 32B (free)",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-04-28 00:00:00 UTC",
    "context_window": 40960,
    "max_output_tokens": 40960,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 40960,
      "context": 40960
    }
  },
  {
    "id": "qwen/qwen3-8b:free",
    "name": "Qwen3 8B (free)",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-04-28 00:00:00 UTC",
    "context_window": 40960,
    "max_output_tokens": 40960,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 40960,
      "context": 40960
    }
  },
  {
    "id": "qwen/qwen3-coder",
    "name": "Qwen3 Coder",
    "provider": "openrouter",
    "family": "qwen3-coder",
    "created_at": "2025-07-23 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 66536,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 1.2,
          "reasoning_output_per_million": 1.2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 66536,
      "context": 262144
    }
  },
  {
    "id": "qwen/qwen3-coder-30b-a3b-instruct",
    "name": "Qwen3 Coder 30B A3B Instruct",
    "provider": "openrouter",
    "family": "qwen3-coder",
    "created_at": "2025-07-31 00:00:00 UTC",
    "context_window": 160000,
    "max_output_tokens": 65536,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.07,
          "output_per_million": 0.27,
          "reasoning_output_per_million": 0.27
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.07,
      "output": 65536,
      "context": 160000
    }
  },
  {
    "id": "qwen/qwen3-coder-flash",
    "name": "Qwen3 Coder Flash",
    "provider": "openrouter",
    "family": "qwen3-coder",
    "created_at": "2025-07-23 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 66536,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 1.5,
          "reasoning_output_per_million": 1.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 66536,
      "context": 128000
    }
  },
  {
    "id": "qwen/qwen3-coder:exacto",
    "name": "Qwen3 Coder (exacto)",
    "provider": "openrouter",
    "family": "qwen3-coder",
    "created_at": "2025-07-23 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.38,
          "output_per_million": 1.53,
          "reasoning_output_per_million": 1.53
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.38,
      "output": 32768,
      "context": 131072
    }
  },
  {
    "id": "qwen/qwen3-coder:free",
    "name": "Qwen3 Coder 480B A35B Instruct (free)",
    "provider": "openrouter",
    "family": "qwen3-coder",
    "created_at": "2025-07-23 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 66536,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 66536,
      "context": 262144
    }
  },
  {
    "id": "qwen/qwen3-max",
    "name": "Qwen3 Max",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-09-05 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 32768,
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 1.2,
          "output_per_million": 6,
          "reasoning_output_per_million": 6
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 1.2,
      "output": 32768,
      "context": 262144
    }
  },
  {
    "id": "qwen/qwen3-next-80b-a3b-instruct",
    "name": "Qwen3 Next 80B A3B Instruct",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-09-11 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 262144,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.14,
          "output_per_million": 1.4,
          "reasoning_output_per_million": 1.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.14,
      "output": 262144,
      "context": 262144
    }
  },
  {
    "id": "qwen/qwen3-next-80b-a3b-thinking",
    "name": "Qwen3 Next 80B A3B Thinking",
    "provider": "openrouter",
    "family": "qwen3",
    "created_at": "2025-09-11 00:00:00 UTC",
    "context_window": 262144,
    "max_output_tokens": 262144,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.14,
          "output_per_million": 1.4,
          "reasoning_output_per_million": 1.4
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.14,
      "output": 262144,
      "context": 262144
    }
  },
  {
    "id": "qwen/qwq-32b:free",
    "name": "QwQ 32B (free)",
    "provider": "openrouter",
    "family": "qwq",
    "created_at": "2025-03-05 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2025-03",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 32768,
      "context": 32768
    }
  },
  {
    "id": "rekaai/reka-flash-3",
    "name": "Reka Flash 3",
    "provider": "openrouter",
    "family": "reka-flash",
    "created_at": "2025-03-12 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-10",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 8192,
      "context": 32768
    }
  },
  {
    "id": "sarvamai/sarvam-m:free",
    "name": "Sarvam-M (free)",
    "provider": "openrouter",
    "family": "sarvam-m",
    "created_at": "2025-05-25 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2025-05",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 32768,
      "context": 32768
    }
  },
  {
    "id": "text-embedding-3-large",
    "name": "text-embedding-3-large",
    "provider": "openai",
    "family": "text-embedding-3-large",
    "created_at": "2024-01-25 00:00:00 UTC",
    "context_window": 8191,
    "max_output_tokens": 3072,
    "knowledge_cutoff": "2024-01",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.13,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.13,
      "output": 3072,
      "context": 8191
    }
  },
  {
    "id": "text-embedding-3-small",
    "name": "text-embedding-3-small",
    "provider": "openai",
    "family": "text-embedding-3-small",
    "created_at": "2024-01-25 00:00:00 UTC",
    "context_window": 8191,
    "max_output_tokens": 1536,
    "knowledge_cutoff": "2024-01",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.02,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.02,
      "output": 1536,
      "context": 8191
    }
  },
  {
    "id": "text-embedding-ada-002",
    "name": "text-embedding-ada-002",
    "provider": "openai",
    "family": "text-embedding-ada",
    "created_at": "2022-12-15 00:00:00 UTC",
    "context_window": 8192,
    "max_output_tokens": 1536,
    "knowledge_cutoff": "2022-12",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.1,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.1,
      "output": 1536,
      "context": 8192
    }
  },
  {
    "id": "thudm/glm-z1-32b:free",
    "name": "GLM Z1 32B (free)",
    "provider": "openrouter",
    "family": "glm-z1",
    "created_at": "2025-04-17 00:00:00 UTC",
    "context_window": 32768,
    "max_output_tokens": 32768,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 32768,
      "context": 32768
    }
  },
  {
    "id": "tngtech/deepseek-r1t2-chimera:free",
    "name": "DeepSeek R1T2 Chimera (free)",
    "provider": "openrouter",
    "family": "deepseek-r1",
    "created_at": "2025-07-08 00:00:00 UTC",
    "context_window": 163840,
    "max_output_tokens": 163840,
    "knowledge_cutoff": "2025-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 163840,
      "context": 163840
    }
  },
  {
    "id": "x-ai/grok-3",
    "name": "Grok 3",
    "provider": "openrouter",
    "family": "grok-3",
    "created_at": "2025-02-17 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-11",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.75,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 8192,
      "cache_read": 0.75,
      "cache_write": 15,
      "context": 131072
    }
  },
  {
    "id": "x-ai/grok-3-beta",
    "name": "Grok 3 Beta",
    "provider": "openrouter",
    "family": "grok-3",
    "created_at": "2025-02-17 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-11",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.75,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 8192,
      "cache_read": 0.75,
      "cache_write": 15,
      "context": 131072
    }
  },
  {
    "id": "x-ai/grok-3-mini",
    "name": "Grok 3 Mini",
    "provider": "openrouter",
    "family": "grok-3",
    "created_at": "2025-02-17 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-11",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 0.5,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 0.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 8192,
      "cache_read": 0.075,
      "cache_write": 0.5,
      "context": 131072
    }
  },
  {
    "id": "x-ai/grok-3-mini-beta",
    "name": "Grok 3 Mini Beta",
    "provider": "openrouter",
    "family": "grok-3",
    "created_at": "2025-02-17 00:00:00 UTC",
    "context_window": 131072,
    "max_output_tokens": 8192,
    "knowledge_cutoff": "2024-11",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.3,
          "output_per_million": 0.5,
          "cached_input_per_million": 0.075,
          "reasoning_output_per_million": 0.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.3,
      "output": 8192,
      "cache_read": 0.075,
      "cache_write": 0.5,
      "context": 131072
    }
  },
  {
    "id": "x-ai/grok-4",
    "name": "Grok 4",
    "provider": "openrouter",
    "family": "grok-4",
    "created_at": "2025-07-09 00:00:00 UTC",
    "context_window": 256000,
    "max_output_tokens": 64000,
    "knowledge_cutoff": "2025-07",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 3,
          "output_per_million": 15,
          "cached_input_per_million": 0.75,
          "reasoning_output_per_million": 15
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 3,
      "output": 64000,
      "cache_read": 0.75,
      "cache_write": 15,
      "context": 256000
    }
  },
  {
    "id": "x-ai/grok-4-fast",
    "name": "Grok 4 Fast",
    "provider": "openrouter",
    "family": "grok-4",
    "created_at": "2025-08-19 00:00:00 UTC",
    "context_window": 2000000,
    "max_output_tokens": 30000,
    "knowledge_cutoff": "2024-11",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.2,
          "output_per_million": 0.5,
          "cached_input_per_million": 0.05,
          "reasoning_output_per_million": 0.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.2,
      "output": 30000,
      "cache_read": 0.05,
      "cache_write": 0.05,
      "context": 2000000
    }
  },
  {
    "id": "x-ai/grok-4.1-fast",
    "name": "Grok 4.1 Fast",
    "provider": "openrouter",
    "family": "grok-4",
    "created_at": "2025-11-19 00:00:00 UTC",
    "context_window": 2000000,
    "max_output_tokens": 30000,
    "knowledge_cutoff": "2024-11",
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.2,
          "output_per_million": 0.5,
          "cached_input_per_million": 0.05,
          "reasoning_output_per_million": 0.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.2,
      "output": 30000,
      "cache_read": 0.05,
      "cache_write": 0.05,
      "context": 2000000
    }
  },
  {
    "id": "x-ai/grok-code-fast-1",
    "name": "Grok Code Fast 1",
    "provider": "openrouter",
    "family": "grok",
    "created_at": "2025-08-26 00:00:00 UTC",
    "context_window": 256000,
    "max_output_tokens": 10000,
    "knowledge_cutoff": "2025-08",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.2,
          "output_per_million": 1.5,
          "cached_input_per_million": 0.02,
          "reasoning_output_per_million": 1.5
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.2,
      "output": 10000,
      "cache_read": 0.02,
      "context": 256000
    }
  },
  {
    "id": "z-ai/glm-4.5",
    "name": "GLM 4.5",
    "provider": "openrouter",
    "family": "glm-4.5",
    "created_at": "2025-07-28 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 96000,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.6,
          "output_per_million": 2.2,
          "reasoning_output_per_million": 2.2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.6,
      "output": 96000,
      "context": 128000
    }
  },
  {
    "id": "z-ai/glm-4.5-air",
    "name": "GLM 4.5 Air",
    "provider": "openrouter",
    "family": "glm-4.5-air",
    "created_at": "2025-07-28 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 96000,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.2,
          "output_per_million": 1.1,
          "reasoning_output_per_million": 1.1
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.2,
      "output": 96000,
      "context": 128000
    }
  },
  {
    "id": "z-ai/glm-4.5-air:free",
    "name": "GLM 4.5 Air (free)",
    "provider": "openrouter",
    "family": "glm-4.5-air",
    "created_at": "2025-07-28 00:00:00 UTC",
    "context_window": 128000,
    "max_output_tokens": 96000,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0,
          "output_per_million": 0,
          "reasoning_output_per_million": 0
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0,
      "output": 96000,
      "context": 128000
    }
  },
  {
    "id": "z-ai/glm-4.5v",
    "name": "GLM 4.5V",
    "provider": "openrouter",
    "family": "glm-4.5v",
    "created_at": "2025-08-11 00:00:00 UTC",
    "context_window": 64000,
    "max_output_tokens": 16384,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text",
        "image",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "vision",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.6,
          "output_per_million": 1.8,
          "reasoning_output_per_million": 1.8
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.6,
      "output": 16384,
      "context": 64000
    }
  },
  {
    "id": "z-ai/glm-4.6",
    "name": "GLM 4.6",
    "provider": "openrouter",
    "family": "glm-4.6",
    "created_at": "2025-09-30 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2025-09",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.6,
          "output_per_million": 2.2,
          "cached_input_per_million": 0.11,
          "reasoning_output_per_million": 2.2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.6,
      "output": 128000,
      "cache_read": 0.11,
      "context": 200000
    }
  },
  {
    "id": "z-ai/glm-4.6:exacto",
    "name": "GLM 4.6 (exacto)",
    "provider": "openrouter",
    "family": "glm-4.6",
    "created_at": "2025-09-30 00:00:00 UTC",
    "context_window": 200000,
    "max_output_tokens": 128000,
    "knowledge_cutoff": "2025-09",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.6,
          "output_per_million": 1.9,
          "cached_input_per_million": 0.11,
          "reasoning_output_per_million": 1.9
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.6,
      "output": 128000,
      "cache_read": 0.11,
      "context": 200000
    }
  },
  {
    "id": "z-ai/glm-4.7",
    "name": "GLM-4.7",
    "provider": "openrouter",
    "family": "glm-4.7",
    "created_at": "2025-12-22 00:00:00 UTC",
    "context_window": 204800,
    "max_output_tokens": 131072,
    "knowledge_cutoff": "2025-04",
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "capabilities": [
      "streaming",
      "reasoning",
      "chat",
      "function_calling",
      "tools",
      "structured_output",
      "json_mode"
    ],
    "pricing": {
      "text_tokens": {
        "standard": {
          "input_per_million": 0.6,
          "output_per_million": 2.2,
          "cached_input_per_million": 0.11,
          "reasoning_output_per_million": 2.2
        }
      }
    },
    "metadata": {
      "source": "models.dev",
      "input": 0.6,
      "output": 131072,
      "cache_read": 0.11,
      "context": 204800
    }
  }
];
